"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useStatsStore } from "@/stores/stats-store"
import { useDrillStore } from "@/stores/drill-store"
import { useYoloStore } from "@/stores/yolo-store"
import { useSettingsStore } from "@/stores/settings-store"
import {
  fetchUserDataForSync,
  pushLocalSessionsToDB,
  pushDrillProfileToDB,
  pushYoloProfileToDB,
  pushSettingsToDB,
} from "@/app/actions/sync"
import { toast } from "sonner"

/**
 * Syncs anonymous localStorage data with the database on login/signup.
 *
 * Strategy:
 * 1. When user first becomes authenticated, fetch their DB data.
 * 2. Merge: for each store, take the union of localStorage and DB records,
 *    preferring whichever is more recent (by timestamp or score).
 * 3. Push any localStorage-only records to DB.
 * 4. Update localStorage with the merged result.
 *
 * This runs once per login session (guarded by a ref).
 */
export function useSyncOnLogin() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const hasSynced = useRef(false)
  const prevAuth = useRef(false)

  useEffect(() => {
    // Detect transition: was not authenticated → now authenticated
    if (isLoading) return

    const justLoggedIn = !prevAuth.current && isAuthenticated
    prevAuth.current = isAuthenticated

    if (!justLoggedIn || hasSynced.current || !user?.id) return
    hasSynced.current = true

    // Run sync in background — don't block the UI
    ;(async () => {
      try {
        const result = await fetchUserDataForSync()
        if (!result.success || !result.data) {
          console.warn("Sync fetch failed:", result.error)
          return
        }

        const { sessions: dbSessions, drillProfile, yoloProfile, settings } = result.data

        // --- 1. Stats Store: Merge session history ---
        const localHistory = useStatsStore.getState().history
        const mergedHistory = mergeSessionHistory(localHistory, dbSessions)
        const mergedBestWpm = mergedHistory.reduce(
          (max, s) => Math.max(max, s.wpm),
          0
        )
        const mergedAvgWpm =
          mergedHistory.length > 0
            ? Math.round(
                mergedHistory.reduce((sum, s) => sum + s.wpm, 0) /
                  mergedHistory.length
              )
            : 0
        const mergedAvgAcc =
          mergedHistory.length > 0
            ? Math.round(
                mergedHistory.reduce((sum, s) => sum + s.accuracy, 0) /
                  mergedHistory.length
              )
            : 100

        useStatsStore.setState({
          history: mergedHistory,
          bestWpm: mergedBestWpm,
          averageWpm: mergedAvgWpm,
          averageAccuracy: mergedAvgAcc,
        })

        // Push local-only sessions to DB
        const localOnlySessions = localHistory.filter(
          (lh) => !dbSessions.some((ds) => ds.id === lh.id)
        )
        if (localOnlySessions.length > 0) {
          await pushLocalSessionsToDB(localOnlySessions)
        }

        // --- 2. Drill Store: Merge key/bigram/trigram stats ---
        const localDrill = useDrillStore.getState()
        if (drillProfile) {
          const mergedDrill = mergeDrillData(localDrill, drillProfile)
          useDrillStore.setState({
            keyStats: mergedDrill.keyStats,
            bigramStats: mergedDrill.bigramStats,
            trigramStats: mergedDrill.trigramStats,
            mistakeRecords: mergedDrill.mistakeRecords,
            drillHistory: mergedDrill.drillHistory,
          })
          await pushDrillProfileToDB(mergedDrill)
        } else if (hasLocalDrillData(localDrill)) {
          // No DB data but local data exists — push it
          await pushDrillProfileToDB({
            keyStats: localDrill.keyStats,
            bigramStats: localDrill.bigramStats,
            trigramStats: localDrill.trigramStats,
            mistakeRecords: localDrill.mistakeRecords,
            drillHistory: localDrill.drillHistory,
          })
        }

        // --- 3. YOLO Store: Merge letter profiles ---
        const localYolo = useYoloStore.getState()
        if (yoloProfile) {
          const mergedYolo = mergeYoloData(localYolo, yoloProfile)
          useYoloStore.setState({
            activeLetter: mergedYolo.activeLetter,
            letterProfiles: mergedYolo.letterProfiles,
            totalWordsCompleted: mergedYolo.totalWordsCompleted,
            streak: mergedYolo.streak,
            sessionCount: mergedYolo.sessionCount,
            hasActiveRun: mergedYolo.hasActiveRun,
          })
          await pushYoloProfileToDB(mergedYolo)
        } else if (hasLocalYoloData(localYolo)) {
          await pushYoloProfileToDB({
            activeLetter: localYolo.activeLetter,
            letterProfiles: localYolo.letterProfiles,
            totalWordsCompleted: localYolo.totalWordsCompleted,
            streak: localYolo.streak,
            sessionCount: localYolo.sessionCount,
            hasActiveRun: localYolo.hasActiveRun,
          })
        }

        // --- 4. Settings: Use DB settings if they exist, else push local ---
        const localSettings = useSettingsStore.getState()
        if (settings) {
          useSettingsStore.setState({
            theme: settings.theme as any,
            typingSounds: settings.typingSounds,
            achievementSounds: settings.achievementSounds,
            notificationSounds: settings.notificationSounds,
            reducedMotion: settings.reducedMotion,
            achievementToasts: settings.achievementToasts,
            animations: settings.animations,
            fontSize: settings.fontSize,
            textWidth: settings.textWidth as any,
            caretStyle: settings.caretStyle as any,
            accentColor: settings.accentColor as any,
            difficulty: settings.difficulty as any,
          })
        } else {
          await pushSettingsToDB({
            theme: localSettings.theme,
            typingSounds: localSettings.typingSounds,
            achievementSounds: localSettings.achievementSounds,
            notificationSounds: localSettings.notificationSounds,
            reducedMotion: localSettings.reducedMotion,
            achievementToasts: localSettings.achievementToasts,
            animations: localSettings.animations,
            fontSize: localSettings.fontSize,
            textWidth: localSettings.textWidth,
            caretStyle: localSettings.caretStyle,
            accentColor: localSettings.accentColor,
            difficulty: localSettings.difficulty,
          })
        }

        console.log(
          `[Sync] Complete. ${mergedHistory.length} sessions merged.`
        )
      } catch (err) {
        console.error("[Sync] Background sync failed:", err)
      }
    })()
  }, [isAuthenticated, isLoading, user?.id])
}

// --- Merge Helpers ---

/**
 * Merges local session history with DB sessions.
 * Strategy: union by ID, keep the most recent version, cap at 50.
 */
function mergeSessionHistory(
  local: any[],
  db: { id: string; timestamp: number; [key: string]: any }[]
): any[] {
  const map = new Map<string, any>()

  // Add DB sessions first (they are authoritative)
  for (const s of db) {
    map.set(s.id, {
      ...s,
      timestamp: s.timestamp,
    })
  }

  // Overlay local sessions (may have more recent data or local-only records)
  for (const s of local) {
    const existing = map.get(s.id)
    if (!existing || s.timestamp > existing.timestamp) {
      map.set(s.id, s)
    }
  }

  // Sort by timestamp descending, cap at 50
  return Array.from(map.values())
    .sort((a: any, b: any) => b.timestamp - a.timestamp)
    .slice(0, 50)
}

/**
 * Merges drill data: for each key/bigram/trigram, take the higher attempt count.
 */
function mergeDrillData(
  local: {
    keyStats: Record<string, any>
    bigramStats: Record<string, any>
    trigramStats: Record<string, any>
    mistakeRecords: any[]
    drillHistory: any[]
  },
  db: {
    keyStats: Record<string, any>
    bigramStats: Record<string, any>
    trigramStats: Record<string, any>
    mistakeRecords: any[]
    drillHistory: any[]
  }
) {
  const mergedKeyStats = mergeKeyStats(local.keyStats, db.keyStats)
  const mergedBigramStats = mergeBigramStats(local.bigramStats, db.bigramStats)
  const mergedTrigramStats = mergeTrigramStats(
    local.trigramStats,
    db.trigramStats
  )

  // Merge mistake records: union, most recent 150
  const allMistakes = [...local.mistakeRecords, ...db.mistakeRecords]
  const uniqueMistakes = allMistakes.slice(-150)

  // Merge drill history: union by id, most recent 50
  const historyMap = new Map<string, any>()
  for (const h of [...db.drillHistory, ...local.drillHistory]) {
    historyMap.set(h.id, h)
  }
  const mergedHistory = Array.from(historyMap.values())
    .sort((a: any, b: any) => b.timestamp - a.timestamp)
    .slice(0, 50)

  return {
    keyStats: mergedKeyStats,
    bigramStats: mergedBigramStats,
    trigramStats: mergedTrigramStats,
    mistakeRecords: uniqueMistakes,
    drillHistory: mergedHistory,
  }
}

function mergeKeyStats(
  local: Record<string, any>,
  db: Record<string, any>
): Record<string, any> {
  const merged = { ...db }
  for (const [key, stats] of Object.entries(local)) {
    if (!merged[key]) {
      merged[key] = stats
    } else {
      // Take the one with more attempts (more data = more accurate)
      if (stats.totalAttempts > merged[key].totalAttempts) {
        merged[key] = stats
      }
    }
  }
  return merged
}

function mergeBigramStats(
  local: Record<string, any>,
  db: Record<string, any>
): Record<string, any> {
  const merged = { ...db }
  for (const [pair, stats] of Object.entries(local)) {
    if (!merged[pair]) {
      merged[pair] = stats
    } else if (stats.attempts > merged[pair].attempts) {
      merged[pair] = stats
    }
  }
  return merged
}

function mergeTrigramStats(
  local: Record<string, any>,
  db: Record<string, any>
): Record<string, any> {
  const merged = { ...db }
  for (const [seq, stats] of Object.entries(local)) {
    if (!merged[seq]) {
      merged[seq] = stats
    } else if (stats.attempts > merged[seq].attempts) {
      merged[seq] = stats
    }
  }
  return merged
}

/**
 * Merges YOLO data: takes the higher-confidence version for each letter.
 */
function mergeYoloData(
  local: {
    activeLetter: string | null
    letterProfiles: Record<string, any>
    totalWordsCompleted: number
    streak: number
    sessionCount: number
    hasActiveRun: boolean
  },
  db: {
    activeLetter: string | null
    letterProfiles: Record<string, any>
    totalWordsCompleted: number
    streak: number
    sessionCount: number
    hasActiveRun: boolean
  }
) {
  // Merge letter profiles: take higher confidence per letter
  const mergedProfiles: Record<string, any> = { ...db.letterProfiles }
  for (const [letter, profile] of Object.entries(local.letterProfiles)) {
    if (!mergedProfiles[letter]) {
      mergedProfiles[letter] = profile
    } else {
      // Take the one with more attempts (more data)
      if (profile.attempts > mergedProfiles[letter].attempts) {
        mergedProfiles[letter] = profile
      }
    }
  }

  return {
    // Use DB active letter if it exists, else local
    activeLetter: db.activeLetter ?? local.activeLetter,
    letterProfiles: mergedProfiles,
    // Sum word counts (both represent progress)
    totalWordsCompleted:
      db.totalWordsCompleted + local.totalWordsCompleted,
    // Use the higher streak
    streak: Math.max(db.streak, local.streak),
    // Sum session counts
    sessionCount: db.sessionCount + local.sessionCount,
    // If either has an active run, keep it active
    hasActiveRun: db.hasActiveRun || local.hasActiveRun,
  }
}

function hasLocalDrillData(drill: {
  keyStats: Record<string, any>
  bigramStats: Record<string, any>
  trigramStats: Record<string, any>
  mistakeRecords: any[]
  drillHistory: any[]
}): boolean {
  return (
    Object.keys(drill.keyStats).length > 0 ||
    Object.keys(drill.bigramStats).length > 0 ||
    drill.mistakeRecords.length > 0 ||
    drill.drillHistory.length > 0
  )
}

function hasLocalYoloData(yolo: {
  letterProfiles: Record<string, any>
  totalWordsCompleted: number
  sessionCount: number
}): boolean {
  return (
    Object.keys(yolo.letterProfiles).length > 0 ||
    yolo.totalWordsCompleted > 0 ||
    yolo.sessionCount > 0
  )
}
