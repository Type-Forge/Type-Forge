import { create } from "zustand"
import { toast } from "sonner"

interface OpponentProgress {
  userId: string
  progress: number
}

interface MultiplayerState {
  socket: WebSocket | null
  isConnected: boolean
  onlineFriends: Set<string>
  incomingChallenge: {
    roomId: string
    challenger: { id: string; name: string; username: string }
    mode: "words" | "timed"
    value: number
  } | null
  activeRoomId: string | null
  activeRoomSeed: string | null
  activeRoomMode: "words" | "timed" | null
  activeRoomValue: number | null
  activeRoomStatus: "waiting" | "countdown" | "active" | "disconnected" | "finished" | "abandoned" | null
  opponent: { id: string; name: string; username: string } | null
  opponentProgress: number
  countdownRemaining: number | null
  waitingForOpponent: boolean
  playerOneId: string | null
  playerTwoId: string | null
  battleResult: {
    winnerId: string | null
    playerOneWpm: number
    playerTwoWpm: number
    playerOneAcc: number
    playerTwoAcc: number
  } | null
  isLeavingRoom: boolean

  // Actions
  connect: (userId: string) => void
  disconnect: () => void
  sendChallenge: (toUserId: string, config?: { mode: "words" | "timed"; value: number }) => void
  respondToChallenge: (roomId: string, accept: boolean) => void
  sendProgress: (roomId: string, progress: number) => void
  sendFinish: (roomId: string, wpm: number, accuracy: number) => void
  resetMultiplayerState: () => void
  leaveRoom: (roomId: string) => void
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  let reconnectTimeout: NodeJS.Timeout | null = null

  return {
    socket: null,
    isConnected: false,
    onlineFriends: new Set<string>(),
    incomingChallenge: null,
    activeRoomId: null,
    activeRoomSeed: null,
    activeRoomMode: null,
    activeRoomValue: null,
    activeRoomStatus: null,
    opponent: null,
    opponentProgress: 0,
    countdownRemaining: null,
    waitingForOpponent: false,
    playerOneId: null,
    playerTwoId: null,
    battleResult: null,
    isLeavingRoom: false,

    connect: (userId) => {
      const state = get()
      if (state.socket && (state.socket.readyState === WebSocket.OPEN || state.socket.readyState === WebSocket.CONNECTING)) {
        return // Already connected or connecting
      }

      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
        const socket = new WebSocket(`${wsUrl}?userId=${userId}`)

        socket.onopen = () => {
          set({ isConnected: true, socket, isLeavingRoom: false })
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
          }
        }

        socket.onclose = () => {
          set({ isConnected: false, socket: null })
          // Auto-reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            get().connect(userId)
          }, 3000)
        }

        socket.onerror = (err) => {
          console.error("WebSocket error:", err)
        }

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            switch (data.type) {
              case "presence": {
                // Initial or incremental online friends status
                const friends = new Set<string>(data.onlineFriendIds as string[])
                set({ onlineFriends: friends })
                break
              }
              case "friend-connected": {
                const current = new Set(get().onlineFriends)
                current.add(data.userId)
                set({ onlineFriends: current })
                break
              }
              case "friend-disconnected": {
                const current = new Set(get().onlineFriends)
                current.delete(data.userId)
                set({ onlineFriends: current })
                break
              }
              case "challenge-received": {
                set({
                  incomingChallenge: {
                    roomId: data.roomId,
                    challenger: data.challenger,
                    mode: data.mode,
                    value: data.value,
                  },
                })
                break
              }
              case "challenge-declined": {
                toast.error("Challenge was declined by opponent.")
                set({ activeRoomId: null, activeRoomStatus: null })
                break
              }
              case "battle-start": {
                const parts = (data.seed || "").split("_")
                let roomMode: "words" | "timed" = "words"
                let roomValue = 25
                if (parts.length >= 3) {
                  roomMode = parts[0] === "timed" ? "timed" : "words"
                  roomValue = parseInt(parts[1], 10) || 25
                }

                set({
                  activeRoomId: data.roomId,
                  activeRoomSeed: data.seed,
                  activeRoomMode: roomMode,
                  activeRoomValue: roomValue,
                  activeRoomStatus: "countdown",
                  opponent: data.opponent,
                  opponentProgress: 0,
                  battleResult: null,
                  incomingChallenge: null,
                  waitingForOpponent: false,
                  playerOneId: data.playerOneId,
                  playerTwoId: data.playerTwoId,
                })
                // Start a local countdown countdownRemaining
                let secs = 3
                set({ countdownRemaining: secs })
                const interval = setInterval(() => {
                  secs -= 1
                  if (secs <= 0) {
                    clearInterval(interval)
                    set({ countdownRemaining: null, activeRoomStatus: "active" })
                  } else {
                    set({ countdownRemaining: secs })
                  }
                }, 1000)
                break
              }
              case "opponent-progress": {
                set({ opponentProgress: data.progress })
                break
              }
              case "opponent-disconnected": {
                toast.warning("Opponent disconnected. 30 seconds grace period started.")
                set({ activeRoomStatus: "disconnected" })
                break
              }
              case "opponent-reconnected": {
                toast.success("Opponent reconnected!")
                set({ activeRoomStatus: "active" })
                break
              }
              case "battle-finished": {
                set({
                  activeRoomStatus: "finished",
                  waitingForOpponent: false,
                  battleResult: {
                    winnerId: data.winnerId,
                    playerOneWpm: data.playerOneWpm,
                    playerTwoWpm: data.playerTwoWpm,
                    playerOneAcc: data.playerOneAcc,
                    playerTwoAcc: data.playerTwoAcc,
                  },
                })
                break
              }
              case "battle-abandoned": {
                toast.error("Battle abandoned. You win by forfeit!")
                set({
                  activeRoomStatus: "abandoned",
                  waitingForOpponent: false,
                  battleResult: {
                    winnerId: userId,
                    playerOneWpm: data.playerOneWpm ?? 0,
                    playerTwoWpm: data.playerTwoWpm ?? 0,
                    playerOneAcc: data.playerOneAcc ?? 100,
                    playerTwoAcc: data.playerTwoAcc ?? 100,
                  },
                })
                break
              }
              case "waiting-opponent": {
                set({ waitingForOpponent: true })
                break
              }
              case "room-restore": {
                const parts = (data.seed || "").split("_")
                let roomMode: "words" | "timed" = "words"
                let roomValue = 25
                if (parts.length >= 3) {
                  roomMode = parts[0] === "timed" ? "timed" : "words"
                  roomValue = parseInt(parts[1], 10) || 25
                }

                set({
                  activeRoomId: data.roomId,
                  activeRoomSeed: data.seed,
                  activeRoomMode: roomMode,
                  activeRoomValue: roomValue,
                  activeRoomStatus: data.status,
                  opponent: data.opponent,
                  opponentProgress: data.opponentProgress ?? 0,
                  battleResult: null,
                  waitingForOpponent: data.waitingForOpponent ?? false,
                  playerOneId: data.playerOneId,
                  playerTwoId: data.playerTwoId,
                })

                if (data.status === "countdown" && data.countdownRemaining !== null) {
                  let secs = data.countdownRemaining
                  set({ countdownRemaining: secs })
                  const interval = setInterval(() => {
                    secs -= 1
                    if (secs <= 0) {
                      clearInterval(interval)
                      set({ countdownRemaining: null, activeRoomStatus: "active" })
                    } else {
                      set({ countdownRemaining: secs })
                    }
                  }, 1000)
                }
                break
              }
            }
          } catch (err) {
            console.error("Error parsing WS message:", err)
          }
        }
      } catch (err) {
        console.error("WebSocket connection failure:", err)
      }
    },

    disconnect: () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      const state = get()
      if (state.socket) {
        state.socket.close()
      }
      set({ socket: null, isConnected: false })
    },

    sendChallenge: (toUserId, config) => {
      const state = get()
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return
      
      state.socket.send(
        JSON.stringify({
          type: "challenge",
          toUserId,
          mode: config?.mode || "words",
          value: config?.value || 25,
        })
      )
      toast.info("Sending challenge to friend...")
    },

    respondToChallenge: (roomId, accept) => {
      const state = get()
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return

      state.socket.send(
        JSON.stringify({
          type: "respond-challenge",
          roomId,
          accept,
        })
      )
      set({ incomingChallenge: null })
    },

    sendProgress: (roomId, progress) => {
      const state = get()
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return

      state.socket.send(
        JSON.stringify({
          type: "progress",
          roomId,
          progress,
        })
      )
    },

    sendFinish: (roomId, wpm, accuracy) => {
      const state = get()
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return

      state.socket.send(
        JSON.stringify({
          type: "finish",
          roomId,
          wpm,
          accuracy,
        })
      )
    },

    resetMultiplayerState: () => {
      set({
        incomingChallenge: null,
        activeRoomId: null,
        activeRoomSeed: null,
        activeRoomMode: null,
        activeRoomValue: null,
        activeRoomStatus: null,
        opponent: null,
        opponentProgress: 0,
        countdownRemaining: null,
        waitingForOpponent: false,
        playerOneId: null,
        playerTwoId: null,
        battleResult: null,
      })
    },

    leaveRoom: (roomId) => {
      const state = get()
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        state.socket.send(
          JSON.stringify({
            type: "leave-room",
            roomId,
          })
        )
      }
      set({ isLeavingRoom: true })
      get().resetMultiplayerState()
    },
  }
})
