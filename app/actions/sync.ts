"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { SessionMode } from "@/generated/prisma"

export interface SyncedSessionResult {
  id: string
  timestamp: number
  config: any
  wpm: number
  accuracy: number
  totalKeystrokes: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  duration: number
  wordsCompleted: number
  timeline?: any
  errorKeys?: any
}

export interface SyncedDrillProfile {
  keyStats: Record<string, any>
  bigramStats: Record<string, any>
  trigramStats: Record<string, any>
  mistakeRecords: any[]
  drillHistory: any[]
}

export interface SyncedYoloProfile {
  activeLetter: string | null
  letterProfiles: Record<string, any>
  totalWordsCompleted: number
  streak: number
  sessionCount: number
  hasActiveRun: boolean
}

export interface UserDataSync {
  sessions: SyncedSessionResult[]
  drillProfile: SyncedDrillProfile | null
  yoloProfile: SyncedYoloProfile | null
  settings: {
    theme: string
    typingSounds: boolean
    achievementSounds: boolean
    notificationSounds: boolean
    reducedMotion: boolean
    achievementToasts: boolean
    animations: boolean
    fontSize: number
    textWidth: string
    caretStyle: string
    accentColor: string
    difficulty: string
  } | null
}

/**
 * Fetches all user data from the database for client-side merge.
 * Called after login/signup to sync anonymous localStorage data with DB.
 */
export async function fetchUserDataForSync(): Promise<{
  success: boolean
  data?: UserDataSync
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    const [userSessions, drillProfile, yoloProfile, userSettings] =
      await Promise.all([
        prisma.sessionResult.findMany({
          where: { userId },
          orderBy: { timestamp: "desc" },
          take: 50,
        }),
        prisma.drillProfile.findUnique({
          where: { userId },
        }),
        prisma.yoloProfile.findUnique({
          where: { userId },
        }),
        prisma.userSettings.findUnique({
          where: { userId },
        }),
      ])

    // Transform DB sessions into the client-side format
    const sessions: SyncedSessionResult[] = userSessions.map((s) => ({
      id: s.id,
      timestamp: new Date(s.timestamp).getTime(),
      config: s.config,
      wpm: s.wpm,
      accuracy: s.accuracy,
      totalKeystrokes: s.totalKeystrokes,
      correctKeystrokes: s.correctKeystrokes,
      incorrectKeystrokes: s.incorrectKeystrokes,
      duration: s.duration,
      wordsCompleted: s.wordsCompleted,
      timeline: s.timeline,
      errorKeys: s.errorKeys,
    }))

    // Transform drill profile
    const drill: SyncedDrillProfile | null = drillProfile
      ? {
          keyStats: (drillProfile.keyStats as Record<string, any>) ?? {},
          bigramStats: (drillProfile.bigramStats as Record<string, any>) ?? {},
          trigramStats:
            (drillProfile.trigramStats as Record<string, any>) ?? {},
          mistakeRecords: (drillProfile.mistakeRecords as any[]) ?? [],
          drillHistory: (drillProfile.drillHistory as any[]) ?? [],
        }
      : null

    // Transform yolo profile
    const yolo: SyncedYoloProfile | null = yoloProfile
      ? {
          activeLetter: yoloProfile.activeLetter,
          letterProfiles:
            (yoloProfile.letterProfiles as Record<string, any>) ?? {},
          totalWordsCompleted: yoloProfile.totalWordsCompleted,
          streak: yoloProfile.streak,
          sessionCount: yoloProfile.sessionCount,
          hasActiveRun: yoloProfile.hasActiveRun,
        }
      : null

    // Transform settings
    const settings = userSettings
      ? {
          theme: userSettings.theme,
          typingSounds: userSettings.typingSounds,
          achievementSounds: userSettings.achievementSounds,
          notificationSounds: userSettings.notificationSounds,
          reducedMotion: userSettings.reducedMotion,
          achievementToasts: userSettings.achievementToasts,
          animations: userSettings.animations,
          fontSize: userSettings.fontSize,
          textWidth: userSettings.textWidth,
          caretStyle: userSettings.caretStyle,
          accentColor: userSettings.accentColor,
          difficulty: userSettings.difficulty,
        }
      : null

    return {
      success: true,
      data: { sessions, drillProfile: drill, yoloProfile: yolo, settings },
    }
  } catch (error: any) {
    console.error("Error fetching user data for sync:", error)
    return {
      success: false,
      error: error?.message || "Failed to fetch user data",
    }
  }
}

/**
 * Pushes local-only session results to the database.
 * Used to persist anonymous session data when a user logs in.
 */
export async function pushLocalSessionsToDB(
  sessions: SyncedSessionResult[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    // Filter out sessions that already exist in DB (by ID)
    const existingIds = new Set(
      (
        await prisma.sessionResult.findMany({
          where: { userId, id: { in: sessions.map((s) => s.id) } },
          select: { id: true },
        })
      ).map((r) => r.id)
    )

    const newSessions = sessions.filter((s) => !existingIds.has(s.id))

    if (newSessions.length === 0) {
      return { success: true }
    }

    // Batch create new sessions
    await prisma.sessionResult.createMany({
      data: newSessions.map((s) => ({
        id: s.id,
        userId,
        timestamp: new Date(s.timestamp),
        wpm: s.wpm,
        accuracy: s.accuracy,
        totalKeystrokes: s.totalKeystrokes,
        correctKeystrokes: s.correctKeystrokes,
        incorrectKeystrokes: s.incorrectKeystrokes,
        duration: s.duration,
        wordsCompleted: s.wordsCompleted,
        mode: mapMode(s.config?.mode),
        config: s.config ?? {},
        timeline: s.timeline ?? [],
        errorKeys: s.errorKeys ?? null,
      })),
    })

    // Update leaderboard entries and personal bests for qualifying sessions
    for (const s of newSessions) {
      const mode = s.config?.mode
      const score = s.wpm * (s.accuracy / 100)

      if (mode === "timed" || mode === "words") {
        try {
          await prisma.leaderboardEntry.upsert({
            where: {
              userId_type: { userId, type: mode },
            },
            create: {
              userId,
              type: mode,
              wpm: s.wpm,
              accuracy: s.accuracy,
              score,
            },
            update: {
              wpm: s.wpm,
              accuracy: s.accuracy,
              score,
            },
          })
        } catch {
          // Table might not exist yet, skip
        }
      }

      // Update user cached bests
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bestScore: true, bestWpm: true, bestAccuracy: true },
      })
      if (user && score > user.bestScore) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            bestScore: score,
            bestWpm: Math.max(user.bestWpm, s.wpm),
            bestAccuracy: Math.max(user.bestAccuracy, s.accuracy),
          },
        })
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error pushing local sessions to DB:", error)
    return {
      success: false,
      error: error?.message || "Failed to push sessions",
    }
  }
}

/**
 * Pushes local drill profile data to the database.
 */
export async function pushDrillProfileToDB(
  drillData: SyncedDrillProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    await prisma.drillProfile.upsert({
      where: { userId },
      create: {
        userId,
        keyStats: drillData.keyStats,
        bigramStats: drillData.bigramStats,
        trigramStats: drillData.trigramStats,
        mistakeRecords: drillData.mistakeRecords,
        drillHistory: drillData.drillHistory,
      },
      update: {
        keyStats: drillData.keyStats,
        bigramStats: drillData.bigramStats,
        trigramStats: drillData.trigramStats,
        mistakeRecords: drillData.mistakeRecords,
        drillHistory: drillData.drillHistory,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error pushing drill profile to DB:", error)
    return {
      success: false,
      error: error?.message || "Failed to push drill profile",
    }
  }
}

/**
 * Pushes local YOLO profile data to the database.
 */
export async function pushYoloProfileToDB(
  yoloData: SyncedYoloProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    await prisma.yoloProfile.upsert({
      where: { userId },
      create: {
        userId,
        activeLetter: yoloData.activeLetter,
        letterProfiles: yoloData.letterProfiles,
        totalWordsCompleted: yoloData.totalWordsCompleted,
        streak: yoloData.streak,
        sessionCount: yoloData.sessionCount,
        hasActiveRun: yoloData.hasActiveRun,
      },
      update: {
        activeLetter: yoloData.activeLetter,
        letterProfiles: yoloData.letterProfiles,
        totalWordsCompleted: yoloData.totalWordsCompleted,
        streak: yoloData.streak,
        sessionCount: yoloData.sessionCount,
        hasActiveRun: yoloData.hasActiveRun,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error pushing YOLO profile to DB:", error)
    return {
      success: false,
      error: error?.message || "Failed to push YOLO profile",
    }
  }
}

/**
 * Pushes local settings to the database.
 */
export async function pushSettingsToDB(
  settings: NonNullable<UserDataSync["settings"]>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: settings.theme,
        typingSounds: settings.typingSounds,
        achievementSounds: settings.achievementSounds,
        notificationSounds: settings.notificationSounds,
        reducedMotion: settings.reducedMotion,
        achievementToasts: settings.achievementToasts,
        animations: settings.animations,
        fontSize: settings.fontSize,
        textWidth: settings.textWidth,
        caretStyle: settings.caretStyle,
        accentColor: settings.accentColor,
        difficulty: settings.difficulty,
      },
      update: {
        theme: settings.theme,
        typingSounds: settings.typingSounds,
        achievementSounds: settings.achievementSounds,
        notificationSounds: settings.notificationSounds,
        reducedMotion: settings.reducedMotion,
        achievementToasts: settings.achievementToasts,
        animations: settings.animations,
        fontSize: settings.fontSize,
        textWidth: settings.textWidth,
        caretStyle: settings.caretStyle,
        accentColor: settings.accentColor,
        difficulty: settings.difficulty,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error pushing settings to DB:", error)
    return {
      success: false,
      error: error?.message || "Failed to push settings",
    }
  }
}

function mapMode(mode: string): SessionMode {
  const map: Record<string, SessionMode> = {
    words: "words" as SessionMode,
    timed: "timed" as SessionMode,
    battle: "battle" as SessionMode,
    drill: "drill" as SessionMode,
    yolo: "yolo" as SessionMode,
  }
  return map[mode] ?? ("words" as SessionMode)
}
