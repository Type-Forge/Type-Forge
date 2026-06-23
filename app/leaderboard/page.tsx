import { prisma } from "@/lib/prisma"
import LeaderboardView from "./LeaderboardView"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  // 1. Fetch Timed-60 Leaders (with dynamic fallback if DB migration is not yet run)
  let timedLeaders: any[] = []
  try {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { type: "timed" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { score: "desc" },
      take: 200,
    })
    timedLeaders = entries
  } catch (err) {
    // Database fallback to cached User score if LeaderboardEntry table doesn't exist
    const users = await prisma.user.findMany({
      where: {
        bestScore: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bestWpm: true,
        bestAccuracy: true,
        bestScore: true,
        updatedAt: true,
      },
      orderBy: {
        bestScore: "desc",
      },
      take: 200,
    })
    timedLeaders = users.map((u) => ({
      id: `fallback-t60-${u.id}`,
      type: "timed-60",
      wpm: u.bestWpm,
      accuracy: u.bestAccuracy,
      score: u.bestScore,
      updatedAt: u.updatedAt,
      user: {
        id: u.id,
        name: u.name,
        username: u.username,
        image: u.image,
      },
    }))
  }

  // 2. Fetch Words-50 Leaders
  let wordsLeaders: any[] = []
  try {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { type: "words" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { score: "desc" },
      take: 200,
    })
    wordsLeaders = entries
  } catch (err) {
    // If the LeaderboardEntry table is not yet created, return empty array for words-50
    wordsLeaders = []
  }

  return <LeaderboardView initialTimed={timedLeaders} initialWords={wordsLeaders} />
}
