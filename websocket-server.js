require("dotenv").config()
const { WebSocketServer } = require("ws")
const { Pool } = require("pg")
const { PrismaPg } = require("@prisma/adapter-pg")
const { PrismaClient } = require("./generated/prisma")

// Initialize Database connection matching app/lib/prisma.ts
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is not set. Standalone WS Server cannot start.")
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PORT = process.env.WS_PORT || 3001
const wss = new WebSocketServer({ port: PORT })

// Transient memory state maps
const onlinePlayers = new Map() // userId -> { socket, username, name }
const activeDisconnectTimeouts = new Map() // userId -> NodeJS.Timeout
const activeRooms = new Map() // roomId -> { playerOneId, playerTwoId, winnerId }

console.log(`WebSocket server started on port ${PORT}`)

wss.on("connection", async (ws, req) => {
  // Grab userId from URL query parameter
  const url = new URL(req.url, "http://localhost")
  const userId = url.searchParams.get("userId")

  if (!userId) {
    ws.close(4001, "userId required")
    return
  }

  try {
    // 1. Fetch user details from database to authenticate & identify
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true },
    })

    if (!dbUser) {
      ws.close(4002, "User not found")
      return
    }

    const playerInfo = {
      socket: ws,
      id: dbUser.id,
      name: dbUser.name || "Anonymous",
      username: dbUser.username || "user",
    }

    onlinePlayers.set(userId, playerInfo)
    console.log(`Player connected: @${playerInfo.username} (${userId})`)

    // Clear any active disconnection grace timeout for this player
    if (activeDisconnectTimeouts.has(userId)) {
      clearTimeout(activeDisconnectTimeouts.get(userId))
      activeDisconnectTimeouts.delete(userId)
      console.log(`Disconnection timeout cleared for @${playerInfo.username}`)
    }

    // 2. Fetch player's friends to broadcast presence updates
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
    })

    const friendIds = friendships.map((f) =>
      f.userOneId === userId ? f.userTwoId : f.userOneId
    )

    // Notify online friends that this user connected
    friendIds.forEach((friendId) => {
      const friend = onlinePlayers.get(friendId)
      if (friend && friend.socket.readyState === 1) {
        friend.socket.send(
          JSON.stringify({
            type: "friend-connected",
            userId: userId,
          })
        )
      }
    })

    // Send the user the list of currently online friends
    const onlineFriendIds = friendIds.filter((friendId) => onlinePlayers.has(friendId))
    ws.send(
      JSON.stringify({
        type: "presence",
        onlineFriendIds,
      })
    )

    // 3. Handle active room restoration
    const activeRoom = await prisma.battleRoom.findFirst({
      where: {
        OR: [{ playerOneId: userId }, { playerTwoId: userId }],
        status: { in: ["waiting", "countdown", "active", "disconnected"] },
      },
    })

    if (activeRoom) {
      console.log(`Restoring room ${activeRoom.id} for player @${playerInfo.username}`)
      
      const opponentId = activeRoom.playerOneId === userId ? activeRoom.playerTwoId : activeRoom.playerOneId
      const dbOpponent = await prisma.user.findUnique({
        where: { id: opponentId },
        select: { id: true, name: true, username: true },
      })

      // Cache active room in memory
      activeRooms.set(activeRoom.id, {
        playerOneId: activeRoom.playerOneId,
        playerTwoId: activeRoom.playerTwoId,
        winnerId: activeRoom.winnerId,
      })

      const isPlayerOne = activeRoom.playerOneId === userId
      const hasFinished = isPlayerOne ? activeRoom.playerOneWpm !== null : activeRoom.playerTwoWpm !== null

      let countdownRemaining = null
      if (activeRoom.status === "countdown" && activeRoom.countdownStartedAt) {
        const elapsedMs = Date.now() - new Date(activeRoom.countdownStartedAt).getTime()
        countdownRemaining = Math.max(1, 3 - Math.floor(elapsedMs / 1000))
      }

      // If the room was marked as disconnected, restore status to active
      let targetStatus = activeRoom.status
      if (activeRoom.status === "disconnected") {
        targetStatus = "active"
        await prisma.battleRoom.update({
          where: { id: activeRoom.id },
          data: { status: "active" },
        })

        // Notify the opponent that player reconnected
        const opponent = onlinePlayers.get(opponentId)
        if (opponent && opponent.socket.readyState === 1) {
          opponent.socket.send(
            JSON.stringify({
              type: "opponent-reconnected",
            })
          )
        }
      }

      // Send room restore confirmation to client
      ws.send(
        JSON.stringify({
          type: "room-restore",
          roomId: activeRoom.id,
          seed: activeRoom.seed,
          status: targetStatus,
          opponent: dbOpponent,
          playerOneId: activeRoom.playerOneId,
          playerTwoId: activeRoom.playerTwoId,
          waitingForOpponent: hasFinished,
          countdownRemaining,
        })
      )
    }

    // 4. Handle client messages
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message)

        switch (data.type) {
          case "challenge": {
            const toUserId = data.toUserId
            const target = onlinePlayers.get(toUserId)

            if (!target) {
              ws.send(JSON.stringify({ type: "error", message: "Opponent is offline" }))
              return
            }

            // Create BattleRoom database record (DB is source of truth)
            const mode = data.mode || "words"
            const value = data.value || 25
            const randomSeed = Math.random().toString(36).substring(7)
            const seed = `${mode}_${value}_${randomSeed}`

            const room = await prisma.battleRoom.create({
              data: {
                playerOneId: userId,
                playerTwoId: toUserId,
                status: "waiting",
                seed,
              },
            })

            // Send challenge proposal to target player
            target.socket.send(
              JSON.stringify({
                type: "challenge-received",
                roomId: room.id,
                mode,
                value,
                challenger: {
                  id: userId,
                  name: playerInfo.name,
                  username: playerInfo.username,
                },
              })
            )
            break
          }

          case "respond-challenge": {
            const { roomId, accept } = data
            const room = await prisma.battleRoom.findUnique({
              where: { id: roomId },
            })

            if (!room) return

            const opponentId = room.playerOneId === userId ? room.playerTwoId : room.playerOneId
            const opponent = onlinePlayers.get(opponentId)

            if (accept) {
              // Update DB room status
              const updatedRoom = await prisma.battleRoom.update({
                where: { id: roomId },
                data: {
                  status: "countdown",
                  countdownStartedAt: new Date(),
                },
              })

              // Cache room in memory
              activeRooms.set(roomId, {
                playerOneId: room.playerOneId,
                playerTwoId: room.playerTwoId,
                winnerId: null,
              })

              const msg = {
                type: "battle-start",
                roomId: room.id,
                seed: room.seed,
                playerOneId: room.playerOneId,
                playerTwoId: room.playerTwoId,
              }

              // Send battle-start events to both players
              ws.send(
                JSON.stringify({
                  ...msg,
                  opponent: { id: opponentId, name: opponent?.name || "Opponent", username: opponent?.username || "user" },
                })
              )

              if (opponent) {
                opponent.socket.send(
                  JSON.stringify({
                    ...msg,
                    opponent: { id: userId, name: playerInfo.name, username: playerInfo.username },
                  })
                )
              }

              // Transition room status to active in DB after 3 seconds countdown
              setTimeout(async () => {
                try {
                  const currentRoom = await prisma.battleRoom.findUnique({
                    where: { id: roomId },
                  })
                  if (currentRoom && currentRoom.status === "countdown") {
                    await prisma.battleRoom.update({
                      where: { id: roomId },
                      data: { status: "active" },
                    })
                    console.log(`Room ${roomId} transitioned to active`)
                  }
                } catch (e) {
                  console.error("Error setting room status to active:", e)
                }
              }, 3000)
            } else {
              // Abandon match in DB
              await prisma.battleRoom.update({
                where: { id: roomId },
                data: { status: "abandoned" },
              })
              activeRooms.delete(roomId)

              if (opponent) {
                opponent.socket.send(
                  JSON.stringify({
                    type: "challenge-declined",
                    roomId,
                  })
                )
              }
            }
            break
          }

          case "join-room": {
            const { roomId } = data
            const room = await prisma.battleRoom.findUnique({
              where: { id: roomId },
            })

            if (!room) {
              ws.send(JSON.stringify({ type: "error", message: "Room not found" }))
              return
            }

            if (room.playerOneId !== userId && room.playerTwoId !== userId) {
              ws.send(JSON.stringify({ type: "error", message: "Unauthorized access to room" }))
              return
            }

            const opponentId = room.playerOneId === userId ? room.playerTwoId : room.playerOneId
            const dbOpponent = await prisma.user.findUnique({
              where: { id: opponentId },
              select: { id: true, name: true, username: true },
            })

            // Ensure player socket exists in onlinePlayers map
            if (!onlinePlayers.has(userId)) {
              onlinePlayers.set(userId, playerInfo)
            }

            // Cache room in memory
            activeRooms.set(room.id, {
              playerOneId: room.playerOneId,
              playerTwoId: room.playerTwoId,
              winnerId: room.winnerId,
            })

            const isPlayerOne = room.playerOneId === userId
            const hasFinished = isPlayerOne ? room.playerOneWpm !== null : room.playerTwoWpm !== null

            // If the room was marked as disconnected, restore status to active
            let targetStatus = room.status
            if (room.status === "disconnected") {
              targetStatus = "active"
              await prisma.battleRoom.update({
                where: { id: room.id },
                data: { status: "active" },
              })

              // Notify the opponent that player reconnected
              const opponent = onlinePlayers.get(opponentId)
              if (opponent && opponent.socket.readyState === 1) {
                opponent.socket.send(
                  JSON.stringify({
                    type: "opponent-reconnected",
                  })
                )
              }
            }

            // Send restore details to client
            ws.send(
              JSON.stringify({
                type: "room-restore",
                roomId: room.id,
                seed: room.seed,
                status: targetStatus,
                opponent: dbOpponent,
                playerOneId: room.playerOneId,
                playerTwoId: room.playerTwoId,
                waitingForOpponent: hasFinished,
              })
            )
            break
          }

          case "leave-room": {
            const { roomId } = data
            const room = await prisma.battleRoom.findUnique({
              where: { id: roomId },
            })

            if (!room) return

            const isPlayerOne = room.playerOneId === userId
            const opponentId = isPlayerOne ? room.playerTwoId : room.playerOneId
            const opponent = onlinePlayers.get(opponentId)

            if (room.status === "countdown" || room.status === "active" || room.status === "disconnected") {
              // The user left an active match! This is a forfeit.
              const winnerId = opponentId // Opponent wins

              await prisma.battleRoom.update({
                where: { id: roomId },
                data: {
                  status: "abandoned",
                  winnerId,
                  finishedAt: new Date(),
                },
              })

              activeRooms.delete(roomId)

              // Write to BattleHistory
              await prisma.battleHistory.create({
                data: {
                  roomId,
                  playerOneId: room.playerOneId,
                  playerTwoId: room.playerTwoId,
                  winnerId,
                  playerOneWpm: room.playerOneWpm || 0,
                  playerTwoWpm: room.playerTwoWpm || 0,
                  playerOneAccuracy: room.playerOneAcc || 0,
                  playerTwoAccuracy: room.playerTwoAcc || 0,
                },
              })

              // Notify opponent
              if (opponent && opponent.socket.readyState === 1) {
                opponent.socket.send(
                  JSON.stringify({
                    type: "battle-abandoned",
                    playerOneWpm: room.playerOneWpm || 0,
                    playerTwoWpm: room.playerTwoWpm || 0,
                    playerOneAcc: room.playerOneAcc || 0,
                    playerTwoAcc: room.playerTwoAcc || 0,
                  })
                )
              }
            } else if (room.status === "waiting") {
              // Challenge was active but not started.
              await prisma.battleRoom.update({
                where: { id: roomId },
                data: { status: "abandoned" },
              })
              activeRooms.delete(roomId)

              if (opponent && opponent.socket.readyState === 1) {
                opponent.socket.send(
                  JSON.stringify({
                    type: "challenge-declined",
                    roomId,
                  })
                )
              }
            }
            break
          }

          case "progress": {
            const { roomId, progress } = data
            let roomInfo = activeRooms.get(roomId)
            if (!roomInfo) {
              const room = await prisma.battleRoom.findUnique({
                where: { id: roomId },
              })

              if (!room) return
              roomInfo = {
                playerOneId: room.playerOneId,
                playerTwoId: room.playerTwoId,
                winnerId: room.winnerId,
              }
              activeRooms.set(roomId, roomInfo)
            }

            const opponentId = roomInfo.playerOneId === userId ? roomInfo.playerTwoId : roomInfo.playerOneId
            const opponent = onlinePlayers.get(opponentId)

            // Forward transient progress update to opponent
            if (opponent && opponent.socket.readyState === 1) {
              opponent.socket.send(
                JSON.stringify({
                  type: "opponent-progress",
                  progress,
                })
              )
            }
            break
          }

          case "finish": {
            const { roomId, wpm, accuracy } = data
            const room = await prisma.battleRoom.findUnique({
              where: { id: roomId },
            })

            if (!room || room.status === "finished" || room.status === "abandoned") return

            const isPlayerOne = room.playerOneId === userId
            const opponentId = isPlayerOne ? room.playerTwoId : room.playerOneId
            const opponent = onlinePlayers.get(opponentId)

            // We update the local player stats in DB.
            const dbUpdate = isPlayerOne
              ? { playerOneWpm: wpm, playerOneAcc: accuracy }
              : { playerTwoWpm: wpm, playerTwoAcc: accuracy }

            // Check if the opponent has already finished
            const opponentFinished = isPlayerOne
              ? room.playerTwoWpm !== null
              : room.playerOneWpm !== null

            if (opponentFinished) {
              // Both players have now finished
              const finalRoomState = await prisma.battleRoom.update({
                where: { id: roomId },
                data: {
                  ...dbUpdate,
                  status: "finished",
                  finishedAt: new Date(),
                },
              })

              // Clear from activeRooms cache
              activeRooms.delete(roomId)

              const p1Wpm = finalRoomState.playerOneWpm || 0
              const p1Acc = finalRoomState.playerOneAcc || 0
              const p2Wpm = finalRoomState.playerTwoWpm || 0
              const p2Acc = finalRoomState.playerTwoAcc || 0
              const winnerId = finalRoomState.winnerId || userId

              // Create completed battle record in BattleHistory
              await prisma.battleHistory.create({
                data: {
                  roomId,
                  playerOneId: room.playerOneId,
                  playerTwoId: room.playerTwoId,
                  winnerId,
                  playerOneWpm: p1Wpm,
                  playerTwoWpm: p2Wpm,
                  playerOneAccuracy: p1Acc,
                  playerTwoAccuracy: p2Acc,
                },
              })

              // Broadcast results
              const results = {
                type: "battle-finished",
                winnerId,
                playerOneWpm: p1Wpm,
                playerTwoWpm: p2Wpm,
                playerOneAcc: p1Acc,
                playerTwoAcc: p2Acc,
              }

              ws.send(JSON.stringify(results))
              if (opponent && opponent.socket.readyState === 1) {
                opponent.socket.send(JSON.stringify(results))
              }
            } else {
              // First player to finish: save stats and set winnerId to this player
              await prisma.battleRoom.update({
                where: { id: roomId },
                data: {
                  ...dbUpdate,
                  winnerId: userId,
                },
              })

              // Cache winnerId in memory
              const cached = activeRooms.get(roomId)
              if (cached) {
                cached.winnerId = userId
              }

              // Notify the player who finished that we are waiting for the opponent
              ws.send(
                JSON.stringify({
                  type: "waiting-opponent",
                  wpm,
                  accuracy,
                })
              )
            }
            break
          }
        }
      } catch (err) {
        console.error("Error processing user socket message:", err)
      }
    })

    // 5. Handle Disconnection & Grace period
    ws.on("close", async () => {
      console.log(`Player disconnected: @${playerInfo.username} (${userId})`)
      onlinePlayers.delete(userId)

      // Notify online friends that this user disconnected
      friendIds.forEach((friendId) => {
        const friend = onlinePlayers.get(friendId)
        if (friend && friend.socket.readyState === 1) {
          friend.socket.send(
            JSON.stringify({
              type: "friend-disconnected",
              userId,
            })
          )
        }
      })

      // Check if user has an active room
      const activeRoom = await prisma.battleRoom.findFirst({
        where: {
          OR: [{ playerOneId: userId }, { playerTwoId: userId }],
          status: { in: ["countdown", "active"] },
        },
      })

      if (activeRoom) {
        // Set DB status to disconnected
        await prisma.battleRoom.update({
          where: { id: activeRoom.id },
          data: { status: "disconnected" },
        })

        const opponentId = activeRoom.playerOneId === userId ? activeRoom.playerTwoId : activeRoom.playerOneId
        const opponent = onlinePlayers.get(opponentId)

        // Notify opponent that the user disconnected
        if (opponent && opponent.socket.readyState === 1) {
          opponent.socket.send(
            JSON.stringify({
              type: "opponent-disconnected",
            })
          )
        }

        // Start 30 seconds grace period timeout (DB is source of truth)
        const timeoutRef = setTimeout(async () => {
          activeDisconnectTimeouts.delete(userId)

          // Double check if room is still disconnected before declaring forfeit
          const latestRoom = await prisma.battleRoom.findUnique({
            where: { id: activeRoom.id },
          })

          if (latestRoom && latestRoom.status === "disconnected") {
            console.log(`Player @${playerInfo.username} forfeited match due to timeout.`)
            
            // Declare forfeit: Opponent wins
            await prisma.battleRoom.update({
              where: { id: activeRoom.id },
              data: {
                status: "abandoned",
                winnerId: opponentId,
                finishedAt: new Date(),
              },
            })

            activeRooms.delete(activeRoom.id)

            // Write to BattleHistory
            await prisma.battleHistory.create({
              data: {
                roomId: activeRoom.id,
                playerOneId: activeRoom.playerOneId,
                playerTwoId: activeRoom.playerTwoId,
                winnerId: opponentId,
                playerOneWpm: latestRoom.playerOneWpm || 0,
                playerTwoWpm: latestRoom.playerTwoWpm || 0,
                playerOneAccuracy: latestRoom.playerOneAcc || 0,
                playerTwoAccuracy: latestRoom.playerTwoAcc || 0,
              },
            })

            // Send abandon message to opponent
            if (opponent && opponent.socket.readyState === 1) {
              opponent.socket.send(
                JSON.stringify({
                  type: "battle-abandoned",
                  playerOneWpm: latestRoom.playerOneWpm || 0,
                  playerTwoWpm: latestRoom.playerTwoWpm || 0,
                  playerOneAcc: latestRoom.playerOneAcc || 0,
                  playerTwoAcc: latestRoom.playerTwoAcc || 0,
                })
              )
            }
          }
        }, 30000)

        activeDisconnectTimeouts.set(userId, timeoutRef)
      }
    })
  } catch (err) {
    console.error("Error setting up connection details:", err)
    ws.close(4003, "Internal server error")
  }
})
