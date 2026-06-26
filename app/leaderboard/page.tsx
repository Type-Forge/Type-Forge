import { prisma } from "@/lib/prisma"
import LeaderboardView from "./LeaderboardView"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  // Fetch both timed and words leaders in a single query
  let timedLeaders: any[] = []
  let wordsLeaders: any[] = []

  try {
    const [timedEntries, wordsEntries] = await Promise.all([
      prisma.leaderboardEntry.findMany({
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
      }),
      prisma.leaderboardEntry.findMany({
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
      }),
    ])
    timedLeaders = timedEntries
    wordsLeaders = wordsEntries
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

  return <LeaderboardView initialTimed={timedLeaders} initialWords={wordsLeaders} />
}
