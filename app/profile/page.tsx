"use client"

import { useMemo, useEffect, useState } from "react"
import { useStatsStore } from "@/stores/stats-store"
import { useDrillStore } from "@/stores/drill-store"
import { calculateKeyWeakness, calculateBigramWeakness } from "@/engine/drill-engine"
import Container from "@/components/ui/Container"
import StatsHistory from "@/components/stats/StatsHistory"
import type { SessionResult } from "@/types"
import { GroupedList, GroupedListItem } from "@/components/ui/GroupedList"

interface RankInfo {
  name: string
  index: number
  isGated: boolean
  originalName: string
  nextRank: { name: string; minWpm: number } | null
  wpmToNext: number
  progressPercent: number
}

const ranks = [
  { name: "Novice", minWpm: 0 },
  { name: "Apprentice", minWpm: 25 },
  { name: "Intermediate", minWpm: 40 },
  { name: "Advanced", minWpm: 55 },
  { name: "Expert", minWpm: 70 },
  { name: "Master", minWpm: 85 },
  { name: "Elite", minWpm: 100 },
  { name: "Grandmaster", minWpm: 120 },
  { name: "Legend", minWpm: 140 },
]

function calculateRank(wpm: number, accuracy: number): RankInfo {
  let naturalIndex = 0
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (wpm >= ranks[i].minWpm) {
      naturalIndex = i
      break
    }
  }

  let maxIndex = ranks.length - 1
  if (accuracy < 50) {
    maxIndex = 0
  } else if (accuracy < 70) {
    maxIndex = 1
  } else if (accuracy < 80) {
    maxIndex = 2
  } else if (accuracy < 90) {
    maxIndex = 3
  } else if (accuracy < 95) {
    maxIndex = 3
  }

  const finalIndex = Math.min(naturalIndex, maxIndex)
  const isGated = naturalIndex > maxIndex

  const currentRank = ranks[finalIndex]
  const nextRank = finalIndex < ranks.length - 1 ? ranks[finalIndex + 1] : null

  let progressPercent = 0
  let wpmToNext = 0
  if (nextRank) {
    wpmToNext = nextRank.minWpm - wpm
    const currentRange = nextRank.minWpm - currentRank.minWpm
    const currentProgress = wpm - currentRank.minWpm
    progressPercent = Math.max(0, Math.min(100, Math.round((currentProgress / currentRange) * 100)))
  } else {
    progressPercent = 100
  }

  return {
    name: currentRank.name,
    index: finalIndex,
    isGated,
    originalName: ranks[naturalIndex].name,
    nextRank,
    wpmToNext: Math.max(0, wpmToNext),
    progressPercent,
  }
}

function getPercentile(wpm: number): string {
  if (wpm >= 120) return "Top 1% Worldwide"
  if (wpm >= 100) return "Top 3% Worldwide"
  if (wpm >= 85) return "Top 8% Worldwide"
  if (wpm >= 70) return "Top 15% Worldwide"
  if (wpm >= 55) return "Top 30% Worldwide"
  if (wpm >= 40) return "Top 50% Worldwide"
  return "Top 80% Worldwide"
}

function calculateDailyStreak(history: SessionResult[]): number {
  if (!history || history.length === 0) return 0
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  const dates = sorted.map(r => new Date(r.timestamp).toDateString())
  const uniqueDates = Array.from(new Set(dates))

  let streak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const hasToday = uniqueDates.includes(today)
  const hasYesterday = uniqueDates.includes(yesterday)

  if (!hasToday && !hasYesterday) return 0

  let currentDate = hasToday ? new Date() : new Date(Date.now() - 86400000)
  
  while (true) {
    const dateStr = currentDate.toDateString()
    if (uniqueDates.includes(dateStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Reusable Circular Progress Ring component (Apple Watch style)
 */
function CircularProgress({ percent, size = 48, strokeWidth = 4.5, className = "" }: { percent: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference
  return (
    <svg width={size} height={size} className={className}>
      <circle
        className="text-border/10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-accent transition-all duration-500 ease-out"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

function WpmTrendChart({ data }: { data: { x: number; y: number; accuracy: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length < 2) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-text-tertiary text-xs bg-surface-secondary/20 rounded-[20px] border border-border/10 p-6 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-text-muted mb-2 animate-pulse"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <span>Complete at least 2 sessions to visualize WPM performance trends.</span>
      </div>
    )
  }

  const wpmValues = data.map(d => d.y)
  const maxWpm = Math.max(...wpmValues, 100)
  const minWpm = Math.min(...wpmValues, 20)
  const range = maxWpm - minWpm || 1

  const width = 600
  const height = 180
  const paddingX = 25
  const paddingY = 20

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
    const y = height - paddingY - ((d.y - minWpm) / range) * (height - paddingY * 2)
    return { x, y }
  })

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  }, "")

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`

  return (
    <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5 relative group/chart">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary font-sans">
          WPM Trend Chart
        </span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
          Last {data.length} sessions
        </span>
      </div>
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            className="stroke-border/10"
            strokeDasharray="4"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            className="stroke-border/10"
            strokeDasharray="4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            className="stroke-border/10"
          />

          {/* Hover Vertical Guide Line */}
          {hoveredIndex !== null && (
            <line
              x1={points[hoveredIndex].x}
              y1={paddingY}
              x2={points[hoveredIndex].x}
              y2={height - paddingY}
              className="stroke-accent/30"
              strokeWidth="1.5"
              strokeDasharray="3"
            />
          )}

          {/* Area under the line */}
          <path
            d={areaD}
            fill="url(#chart-gradient)"
            className="opacity-10"
          />

          {/* Sparkline Path */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                className="fill-bg stroke-accent transition-all duration-150"
                strokeWidth="2.5"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="12"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="fill-accent opacity-0 hover:opacity-10 transition-opacity duration-150 cursor-pointer"
              />
            </g>
          ))}

          {/* Hover pulse circle */}
          {hoveredIndex !== null && (
            <circle
              cx={points[hoveredIndex].x}
              cy={points[hoveredIndex].y}
              r="7"
              className="fill-accent/30 stroke-accent pointer-events-none"
              strokeWidth="1.5"
            />
          )}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Absolute Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute bg-surface/95 border border-border/10 backdrop-blur-md rounded-xl p-2 px-2.5 shadow-lg flex flex-col gap-0.5 pointer-events-none select-none text-[11px] z-10 transition-all duration-75 font-sans"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 15}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <span className="font-bold text-accent leading-none">{data[hoveredIndex].y} WPM</span>
            <span className="text-[10px] text-text-secondary leading-none mt-1">{data[hoveredIndex].accuracy}% Acc</span>
          </div>
        )}
      </div>
      <div className="flex justify-between text-[9px] text-text-tertiary font-bold uppercase tracking-wider px-2 mt-3">
        <span>Min: {minWpm} WPM</span>
        <span>Avg: {Math.round(wpmValues.reduce((a,b)=>a+b,0)/wpmValues.length)} WPM</span>
        <span>Max: {maxWpm} WPM</span>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { history, bestWpm, averageWpm, averageAccuracy } = useStatsStore()
  const { keyStats, bigramStats, mistakeRecords } = useDrillStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  // Calculate Rank and Streak
  const rankInfo = useMemo(() => calculateRank(bestWpm, averageAccuracy), [bestWpm, averageAccuracy])
  const streak = useMemo(() => calculateDailyStreak(history), [history])
  const percentile = useMemo(() => getPercentile(bestWpm), [bestWpm])

  // --- Calculate achievements ---
  const achievements = useMemo(() => {
    return [
      { id: "starter", title: "Decryption Starter", icon: "🏆", desc: "Complete 1 session", unlocked: history.length >= 1 },
      { id: "consistent", title: "Consistent Operator", icon: "🔥", desc: "Complete 10 sessions", unlocked: history.length >= 10 },
      { id: "veteran", title: "Bletchley Veteran", icon: "⚡", desc: "Complete 50 sessions", unlocked: history.length >= 50 },
      { id: "sniper", title: "Sniper", icon: "🎯", desc: "Reach 99%+ accuracy in a test", unlocked: history.some(r => r.accuracy >= 99) },
      { id: "perfect", title: "Perfect Operator", icon: "🛡️", desc: "Reach 100% accuracy in a test", unlocked: history.some(r => r.accuracy === 100) },
      { id: "speed", title: "Speed Demon", icon: "🚀", desc: "Reach 80+ WPM", unlocked: bestWpm >= 80 },
      { id: "gm", title: "Grandmaster Key", icon: "👑", desc: "Reach 120+ WPM", unlocked: bestWpm >= 120 },
    ]
  }, [history, bestWpm])

  // --- Chart Data ---
  const chartData = useMemo(() => {
    const lastResults = [...history].reverse().slice(-15)
    return lastResults.map((r, i) => ({ x: i, y: r.wpm, accuracy: r.accuracy }))
  }, [history])

  // --- Heatmap Data (Last 28 Days) ---
  const heatmapDays = useMemo(() => {
    const days = []
    for (let i = 27; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const startTime = d.getTime()
      const endTime = startTime + 86400000
      const count = history.filter(r => r.timestamp >= startTime && r.timestamp < endTime).length
      days.push({ date: d, count })
    }
    return days
  }, [history])

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
      <Container size="7xl" className="py-8 text-center animate-pulse">
        <div className="h-8 w-48 bg-surface-secondary rounded mx-auto mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-64 bg-surface-secondary rounded-[20px]" />
          <div className="lg:col-span-8 h-96 bg-surface-secondary rounded-[20px]" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="7xl" className="py-6 space-y-8 animate-fade-in font-sans select-none">
      {/* Page Header */}
      <div className="border-b border-border/20 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Profile & Dashboard</h2>
        <p className="text-xs text-text-tertiary mt-1">
          Historical decryption records, typing performance, achievements, and typing profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Hero Card */}
          <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-6 relative overflow-hidden flex flex-col items-center text-center hover:scale-[1.01] hover:bg-surface-hover/10 active:scale-[0.99] transition-all duration-300 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
            
            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent relative z-10 mb-4 shadow-[0_4px_12px_rgba(10,132,255,0.15)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div className="relative z-10 space-y-1">
              <h3 className="text-xl font-bold text-text-primary">Sayandip Roy</h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent uppercase tracking-wider">
                {rankInfo.name} Typist
              </div>
              <p className="text-xs text-text-tertiary font-medium pt-1">
                {percentile}
              </p>
            </div>
          </div>

          {/* Rank Progression / Ladder Card */}
          <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-6 flex flex-col hover:scale-[1.01] hover:bg-surface-hover/10 active:scale-[0.99] transition-all duration-300 shadow-sm">
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary mb-4">
              Rank Progression
            </span>

            {/* Progress block with Circular Ring option */}
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2 flex-1 mr-4">
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                  <span>Rank: {rankInfo.name}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden border border-border/5">
                  <div
                    className="h-full bg-accent transition-all duration-500 rounded-full"
                    style={{ width: `${rankInfo.progressPercent}%` }}
                  />
                </div>
                {rankInfo.nextRank && (
                  <div className="text-[11px] text-text-tertiary">
                    Need {rankInfo.wpmToNext} more WPM to unlock {rankInfo.nextRank.name}
                  </div>
                )}
              </div>
              <CircularProgress percent={rankInfo.progressPercent} size={48} strokeWidth={4.5} className="text-accent flex-shrink-0" />
            </div>

            {/* Accuracy Gate Alert */}
            {rankInfo.isGated && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 flex gap-2.5 items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="flex flex-col text-[11px] leading-relaxed text-amber-400">
                  <span className="font-bold">Accuracy Gate Active</span>
                  <span>Your speed qualifies for {rankInfo.originalName}, but average accuracy is {averageAccuracy}%. Reach 95%+ accuracy to unlock Expert+ ranks.</span>
                </div>
              </div>
            )}

            {/* Rank Ladder */}
            <div className="space-y-1.5 border-t border-border/10 pt-4">
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-tertiary block mb-2">
                Decryption Ranks
              </span>
              <GroupedList>
                {ranks.map((r, idx) => {
                  const isCurrent = rankInfo.name === r.name
                  const isUnlocked = idx <= rankInfo.index
                  return (
                    <GroupedListItem
                      key={r.name}
                      title={r.name}
                      selected={isCurrent}
                      disabled={!isUnlocked}
                      rightElement={
                        <span className="font-sans text-[11px] font-semibold text-text-tertiary tabular-nums">
                          {r.minWpm}+ WPM
                        </span>
                      }
                    />
                  )
                })}
              </GroupedList>
            </div>
          </div>

          {/* Activity Heatmap Grid */}
          <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5 flex flex-col hover:scale-[1.01] hover:bg-surface-hover/10 active:scale-[0.99] transition-all duration-300 shadow-sm">
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary mb-3.5">
              Activity Heatmap
            </span>
            <div className="grid grid-cols-7 gap-1.5 self-center">
              {heatmapDays.map((day, idx) => {
                const level = day.count === 0 ? 0 : day.count === 1 ? 1 : day.count <= 3 ? 2 : 3
                const cellBg =
                  level === 0
                    ? "bg-surface-secondary/60 hover:bg-surface-secondary border border-border/5"
                    : level === 1
                    ? "bg-accent/20 border border-accent/10"
                    : level === 2
                    ? "bg-accent/45 border border-accent/20"
                    : "bg-accent border border-accent/30 shadow-[0_0_8px_rgba(10,132,255,0.25)]"

                const tooltipText = `${day.count} ${day.count === 1 ? "session" : "sessions"} on ${day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`

                return (
                  <div
                    key={idx}
                    title={tooltipText}
                    className={`w-5 h-5 rounded-[4px] cursor-pointer hover:scale-110 active:scale-95 transition-all duration-150 ${cellBg}`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-text-tertiary mt-4 font-semibold px-1">
              <span>28 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Right Column - Dashboard Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stats Cards Grid (Apple Fitness style) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5 flex flex-col justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface-hover/20 active:scale-[0.99] transition-all duration-300 shadow-sm">
              <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                Best Speed
              </span>
              <div className="flex flex-col mt-4">
                <span className="text-3xl font-bold text-accent tracking-tight tabular-nums">
                  {bestWpm}
                </span>
                <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">
                  Words Per Min
                </span>
              </div>
            </div>

            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5 flex flex-col justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface-hover/20 active:scale-[0.99] transition-all duration-300 shadow-sm">
              <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                Average Speed
              </span>
              <div className="flex flex-col mt-4">
                <span className="text-3xl font-bold text-text-primary tracking-tight tabular-nums">
                  {averageWpm}
                </span>
                <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">
                  Words Per Min
                </span>
              </div>
            </div>

            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5 flex items-center justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface-hover/20 active:scale-[0.99] transition-all duration-300 shadow-sm group">
              <div className="flex flex-col justify-between h-full">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Avg Accuracy
                </span>
                <div className="flex flex-col mt-2">
                  <span className="text-3xl font-bold text-text-primary tracking-tight tabular-nums group-hover:text-accent transition-colors">
                    {averageAccuracy}%
                  </span>
                  <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">
                    Accuracy Score
                  </span>
                </div>
              </div>
              <CircularProgress percent={averageAccuracy} size={48} strokeWidth={4.5} className="text-accent flex-shrink-0" />
            </div>

            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5 flex flex-col justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface-hover/20 active:scale-[0.99] transition-all duration-300 shadow-sm">
              <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                Daily Streak
              </span>
              <div className="flex flex-col mt-4">
                <span className="text-3xl font-bold text-text-primary tracking-tight tabular-nums">
                  {streak} <span className="text-xs text-text-tertiary font-semibold">days</span>
                </span>
                <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">
                  Activity Streak
                </span>
              </div>
            </div>
          </div>

          {/* Achievements row */}
          <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5 flex flex-col">
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary mb-4">
              Achievements
            </span>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/20 -mx-1 px-1">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border flex-shrink-0 min-w-[180px] max-w-[240px] transition-all duration-300 hover:scale-[1.03] hover:bg-surface-hover/30 hover:border-accent/30 active:scale-[0.98] ${
                    ach.unlocked
                      ? "bg-accent/5 border-accent/20 shadow-[0_4px_12px_rgba(10,132,255,0.05)]"
                      : "bg-surface/10 border-border/5 opacity-40 grayscale"
                  }`}
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-bold ${ach.unlocked ? "text-text-primary" : "text-text-secondary"}`}>
                      {ach.title}
                    </span>
                    <span className="text-[10px] text-text-tertiary mt-0.5 leading-snug">
                      {ach.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WPM Trend Chart */}
          <WpmTrendChart data={chartData} />

          {/* Weakness Analysis Section */}
          {(focusAreas.length > 0 || mistakePatterns.length > 0) && (
            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-5">
              <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary block mb-4">
                Weakness Analysis
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Slowest Keys */}
                {focusAreas.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2.5">
                      Slowest Keys / Transitions
                    </h4>
                    <div className="divide-y divide-border/10 rounded-2xl bg-surface-secondary/50 border border-border/10 overflow-hidden">
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
                            className="flex items-center justify-between px-4 py-3 text-[13px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-text-primary">
                                {area.label}
                              </span>
                              <span className="text-[10px] text-text-tertiary font-medium capitalize">
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

                {/* Common Mistakes */}
                {mistakePatterns.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2.5">
                      Frequent Typo Patterns
                    </h4>
                    <div className="divide-y divide-border/10 rounded-2xl bg-surface-secondary/50 border border-border/10 overflow-hidden">
                      {mistakePatterns.map((pat, idx) => (
                        <div
                           key={idx}
                          className="flex items-center justify-between px-4 py-3 text-[13px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-danger/90 font-sans">
                              {pat.expected}
                            </span>
                            <span className="text-[11px] text-text-tertiary">→</span>
                            <span className="text-xs font-bold text-text-secondary font-sans">
                              {pat.actual}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-text-tertiary">
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

          {/* History Feed */}
          <div className="pt-2">
            <StatsHistory />
          </div>
        </div>
      </div>
    </Container>
  )
}
