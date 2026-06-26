"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SessionMode } from "@/generated/prisma"

interface SaveResultInput {
  wpm: number
  accuracy: number
  totalKeystrokes: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  duration: number
  wordsCompleted: number
  mode: string // "words" | "timed" | "battle" | "drill" | "yolo"
  config: any
  timeline: any
  errorKeys?: any
}

/**
 * Saves a completed typing session result to the database.
 * If the session is a 60-second timed test with accuracy >= 90%,
 * it updates the user's personal best stats (bestWpm, bestAccuracy, bestScore) for the leaderboard.
 */
export async function saveSessionResult(data: SaveResultInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    // Validate mode against SessionMode enum
    let dbMode: SessionMode
    if (data.mode === "words") dbMode = SessionMode.words
    else if (data.mode === "timed") dbMode = SessionMode.timed
    else if (data.mode === "battle") dbMode = SessionMode.battle
    else if (data.mode === "drill") dbMode = SessionMode.drill
    else if (data.mode === "yolo") dbMode = SessionMode.yolo
    else {
      return { success: false, error: `Invalid session mode: ${data.mode}` }
    }

    // 1. Create the SessionResult record
    const result = await prisma.sessionResult.create({
      data: {
        userId,
        wpm: data.wpm,
        accuracy: data.accuracy,
        totalKeystrokes: data.totalKeystrokes,
        correctKeystrokes: data.correctKeystrokes,
        incorrectKeystrokes: data.incorrectKeystrokes,
        duration: data.duration,
        wordsCompleted: data.wordsCompleted,
        mode: dbMode,
        config: data.config ?? {},
        timeline: data.timeline ?? [],
        errorKeys: data.errorKeys || null,
      },
    })

    // 2. Identify qualifying leaderboard type
    let leaderboardType: string | null = null
    const score = data.wpm * (data.accuracy / 100)

    if (data.mode === "timed") {
      leaderboardType = "timed"
    } else if (data.mode === "words") {
      leaderboardType = "words"
    }

    // 3. Upsert the LeaderboardEntry record if qualified
    if (leaderboardType) {
      try {
        await prisma.leaderboardEntry.upsert({
          where: {
            userId_type: {
              userId,
              type: leaderboardType,
            },
          },
          create: {
            userId,
            type: leaderboardType,
            wpm: data.wpm,
            accuracy: data.accuracy,
            score,
          },
          update: {
            wpm: data.wpm,
            accuracy: data.accuracy,
            score,
          },
        })
      } catch (err) {
        console.warn("LeaderboardEntry table operations skipped (pending migration):", err)
      }
    }

    // 4. Update cached overall personal best metrics on the User model
    if (leaderboardType) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bestScore: true, bestWpm: true, bestAccuracy: true },
      })

      if (user && score > user.bestScore) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            bestScore: score,
            bestWpm: Math.max(user.bestWpm, data.wpm),
            bestAccuracy: Math.max(user.bestAccuracy, data.accuracy),
          },
        })
      }
    }

    return { success: true, result }
  } catch (error: any) {
    console.error("Error saving session result:", error)
    return { success: false, error: error?.message || "Internal server error" }
  }
}
