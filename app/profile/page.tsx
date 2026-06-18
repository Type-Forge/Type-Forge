"use client"

import { useMemo, useEffect, useState } from "react"
import { useStatsStore } from "@/stores/stats-store"
import { useDrillStore } from "@/stores/drill-store"
import { calculateKeyWeakness, calculateBigramWeakness } from "@/engine/drill-engine"
import Container from "@/components/ui/Container"
import StatsHistory from "@/components/stats/StatsHistory"

export default function ProfilePage() {
  const { history, bestWpm, averageWpm, averageAccuracy } = useStatsStore()
  const { keyStats, bigramStats, mistakeRecords } = useDrillStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  // --- Calculate Focus Areas (Weaknesses) ---
  const focusAreas = useMemo(() => {
    const list: Array<{
      type: "key" | "bigram"
      label: string
      accuracy: number
      weakness: number
    }> = []

    const totalIncorrectAllKeys = Object.values(keyStats).reduce(
      (sum, s) => sum + s.totalIncorrect,
      0
    )

    // 1. Process keys
    Object.values(keyStats).forEach((stats) => {
      if (stats.totalAttempts > 0) {
        list.push({
          type: "key",
          label: stats.key.toUpperCase(),
          accuracy: Math.round((stats.totalCorrect / stats.totalAttempts) * 100),
          weakness: calculateKeyWeakness(stats, totalIncorrectAllKeys),
        })
      }
    })

    // 2. Process bigrams
    Object.values(bigramStats).forEach((stats) => {
      if (stats.attempts > 0) {
        list.push({
          type: "bigram",
          label: stats.pair.toUpperCase(),
          accuracy: Math.round(((stats.attempts - stats.mistakes) / stats.attempts) * 100),
          weakness: calculateBigramWeakness(stats),
        })
      }
    })

    // Sort by weakness score descending
    list.sort((a, b) => b.weakness - a.weakness)
    return list.slice(0, 4)
  }, [keyStats, bigramStats])

  // --- Calculate Mistake / Swap Patterns ---
  const mistakePatterns = useMemo(() => {
    const counts: Record<string, { expected: string; actual: string; count: number }> = {}

    mistakeRecords.forEach((m) => {
      const key = `${m.expected}->${m.actual}`
      if (!counts[key]) {
        counts[key] = { expected: m.expected, actual: m.actual, count: 0 }
      }
      counts[key].count++
    })

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [mistakeRecords])

  if (!mounted) {
    return (
      <Container className="py-8 text-center animate-pulse">
        <div className="h-8 w-32 bg-surface-secondary rounded mx-auto mb-8" />
        <div className="h-32 bg-surface-secondary rounded-[20px] max-w-xl mx-auto" />
      </Container>
    )
  }

  return (
    <Container className="py-6 space-y-8 animate-fade-in font-sans select-none max-w-xl">
      {/* Page Header */}
      <div className="border-b border-border/20 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Profile Overview</h2>
        <p className="text-xs text-text-tertiary mt-1">
          Historical decryption records and weak keyboard profiles.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary leading-tight">Decryption Officer</h3>
            <span className="text-xs text-text-tertiary">Active decryptor profile</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl p-4 border border-border/5">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
              Best Speed
            </span>
            <span className="text-xl font-bold text-accent font-sans tabular-nums">
              {bestWpm} <span className="text-xs font-semibold text-text-tertiary">WPM</span>
            </span>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-border/5">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
              Average Speed
            </span>
            <span className="text-xl font-bold text-text-primary font-sans tabular-nums">
              {averageWpm} <span className="text-xs font-semibold text-text-tertiary">WPM</span>
            </span>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-border/5">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
              Average Accuracy
            </span>
            <span className="text-xl font-bold text-text-primary font-sans tabular-nums">
              {averageAccuracy}%
            </span>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-border/5">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
              Total Sessions
            </span>
            <span className="text-xl font-bold text-text-primary font-sans tabular-nums">
              {history.length}
            </span>
          </div>
        </div>
      </div>

      {/* Weakness Analysis Profile Card (Only show if stats are gathered) */}
      {(focusAreas.length > 0 || mistakePatterns.length > 0) && (
        <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5">
          <span className="text-[12px] uppercase font-bold tracking-wider text-accent font-sans block mb-4">
            Weakness Analysis Profile
          </span>

          <div className="flex flex-col gap-6">
            {/* Focus Areas List */}
            {focusAreas.length > 0 && (
              <div>
                <h4 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider mb-3">Slowest Keys / Transitions</h4>
                <div className="divide-y divide-border/10 rounded-xl bg-surface-secondary/50 border border-border/10 overflow-hidden">
                  {focusAreas.map((area, idx) => {
                    const accColor =
                      area.accuracy >= 90
                        ? "text-success"
                        : area.accuracy >= 80
                        ? "text-amber-500"
                        : "text-danger"

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 text-[14px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary">
                            {area.label}
                          </span>
                          <span className="text-[11px] text-text-tertiary font-medium capitalize">
                            ({area.type})
                          </span>
                        </div>
                        <span className={`text-xs font-sans font-bold tabular-nums ${accColor}`}>
                          {area.accuracy}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mistake Patterns List */}
            {mistakePatterns.length > 0 && (
              <div>
                <h4 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider mb-3">Frequent Typo Patterns</h4>
                <div className="divide-y divide-border/10 rounded-xl bg-surface-secondary/50 border border-border/10 overflow-hidden">
                  {mistakePatterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 text-[14px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-danger/90 font-sans">
                          {pat.expected}
                        </span>
                        <span className="text-[12px] text-text-tertiary">→</span>
                        <span className="text-xs font-bold text-text-secondary font-sans">
                          {pat.actual}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-text-tertiary">
                        {pat.count} {pat.count === 1 ? "time" : "times"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Log Section */}
      <div className="-mt-8">
        <StatsHistory />
      </div>
    </Container>
  )
}
