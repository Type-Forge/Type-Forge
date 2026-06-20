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

// Reusable Circular Progress Ring component (Apple Watch style)
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
      <div className="h-44 flex flex-col items-center justify-center text-text-tertiary text-xs bg-surface/50 border border-border/10 rounded-[20px] p-6 text-center">
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
    <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 relative group/chart">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary font-sans">
          WPM Trend
        </span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider font-sans">
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
            <span className="font-bold text-accent leading-none font-sans">{data[hoveredIndex].y} WPM</span>
            <span className="text-[10px] text-text-secondary leading-none mt-1 font-sans">{data[hoveredIndex].accuracy}% Acc</span>
          </div>
        )}
      </div>
      <div className="flex justify-between text-[9px] text-text-tertiary font-bold uppercase tracking-wider px-2 mt-3 font-sans">
        <span>Min: {minWpm} WPM</span>
        <span>Avg: {Math.round(wpmValues.reduce((a,b)=>a+b,0)/wpmValues.length)} WPM</span>
        <span>Max: {maxWpm} WPM</span>
      </div>
    </div>
  )
}

function AccuracyTrendChart({ data }: { data: { x: number; y: number; accuracy: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length < 2) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-text-tertiary text-xs bg-surface/50 border border-border/10 rounded-[20px] p-6 text-center">
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
        <span>Complete at least 2 sessions to visualize Accuracy performance trends.</span>
      </div>
    )
  }

  const accValues = data.map(d => d.accuracy)
  const maxAcc = 100
  const minAcc = Math.min(...accValues, 80)
  const range = maxAcc - minAcc || 1

  const width = 600
  const height = 180
  const paddingX = 25
  const paddingY = 20

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
    const y = height - paddingY - ((d.accuracy - minAcc) / range) * (height - paddingY * 2)
    return { x, y }
  })

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  }, "")

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 relative group/chart font-sans">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary font-sans">
          Accuracy Trend
        </span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider font-sans">
          Last {data.length} sessions
        </span>
      </div>
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
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

          {hoveredIndex !== null && (
            <line
              x1={points[hoveredIndex].x}
              y1={paddingY}
              x2={points[hoveredIndex].x}
              y2={height - paddingY}
              className="stroke-correct/30"
              strokeWidth="1.5"
              strokeDasharray="3"
            />
          )}

          <path
            d={areaD}
            fill="url(#acc-chart-gradient)"
            className="opacity-10"
          />

          <path
            d={pathD}
            fill="none"
            stroke="var(--color-correct)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => (
            <g key={i} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                className="fill-bg stroke-correct transition-all duration-150"
                strokeWidth="2.5"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="12"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="fill-correct opacity-0 hover:opacity-10 transition-opacity duration-150 cursor-pointer"
              />
            </g>
          ))}

          {hoveredIndex !== null && (
            <circle
              cx={points[hoveredIndex].x}
              cy={points[hoveredIndex].y}
              r="7"
              className="fill-correct/30 stroke-correct pointer-events-none"
              strokeWidth="1.5"
            />
          )}

          <defs>
            <linearGradient id="acc-chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-correct)" />
              <stop offset="100%" stopColor="var(--color-correct)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {hoveredIndex !== null && (
          <div
            className="absolute bg-surface/95 border border-border/10 backdrop-blur-md rounded-xl p-2 px-2.5 shadow-lg flex flex-col gap-0.5 pointer-events-none select-none text-[11px] z-10 transition-all duration-75 font-sans"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 15}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <span className="font-bold text-correct leading-none font-sans">{data[hoveredIndex].accuracy}% Acc</span>
            <span className="text-[10px] text-text-secondary leading-none mt-1 font-sans">{data[hoveredIndex].y} WPM</span>
          </div>
        )}
      </div>
      <div className="flex justify-between text-[9px] text-text-tertiary font-bold uppercase tracking-wider px-2 mt-3 font-sans">
        <span>Min: {Math.round(minAcc)}% Acc</span>
        <span>Avg: {Math.round(accValues.reduce((a,b)=>a+b,0)/accValues.length)}% Acc</span>
        <span>Max: {maxAcc}% Acc</span>
      </div>
    </div>
  )
}

function KeyboardHeatmap({ errorKeys }: { errorKeys: Record<string, number> }) {
  const keyboardRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"]
  ]

  const totalErrors = Object.values(errorKeys).reduce((sum, v) => sum + v, 0)

  const getKeyHeatmapStyle = (key: string) => {
    const count = errorKeys[key.toLowerCase()] ?? 0
    if (count === 0) {
      return "bg-surface-secondary/40 text-text-secondary border border-border/10"
    }
    if (count === 1) {
      return "bg-incorrect/15 text-incorrect border border-incorrect/30 font-bold"
    }
    if (count === 2) {
      return "bg-incorrect/30 text-incorrect border border-incorrect/50 font-bold"
    }
    return "bg-incorrect/70 text-white border border-incorrect font-bold shadow-sm"
  }

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-6">
        <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary font-sans">
          Mistake Heatmap
        </span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider font-sans">
          {totalErrors} total key errors
        </span>
      </div>

      <div className="flex flex-col gap-1.5 w-full max-w-md select-none">
        {keyboardRows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 w-full">
            {row.map((char) => (
              <div
                key={char}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-sans border transition-colors ${getKeyHeatmapStyle(
                  char
                )}`}
                title={errorKeys[char] ? `${errorKeys[char]} mistakes on ${char}` : `No mistakes on ${char}`}
              >
                {char.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { history, bestWpm, averageWpm, averageAccuracy } = useStatsStore()
  const { keyStats, bigramStats } = useDrillStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  // Calculate Rank, Streak and Level (1 level per 5 sessions)
  const rankInfo = useMemo(() => calculateRank(bestWpm, averageAccuracy), [bestWpm, averageAccuracy])
  const streak = useMemo(() => calculateDailyStreak(history), [history])
  const percentile = useMemo(() => getPercentile(bestWpm), [bestWpm])

  const level = useMemo(() => Math.floor(history.length / 5) + 1, [history.length])
  const progressPercent = useMemo(() => (history.length % 5) * 20, [history.length])

  const blockString = useMemo(() => {
    const totalBlocks = 10
    const filledBlocks = Math.round((progressPercent / 100) * totalBlocks)
    const emptyBlocks = totalBlocks - filledBlocks
    return "█".repeat(filledBlocks) + "░".repeat(emptyBlocks)
  }, [progressPercent])

  // --- Calculate achievements ---
  const achievements = useMemo(() => {
    return [
      { id: "starter", title: "First Session", desc: "Complete 1 session", unlocked: history.length >= 1 },
      { id: "consistent", title: "Consistent", desc: "Complete 10 sessions", unlocked: history.length >= 10 },
      { id: "veteran", title: "Veteran", desc: "Complete 50 sessions", unlocked: history.length >= 50 },
      { id: "sniper", title: "Sniper", desc: "Reach 99%+ accuracy", unlocked: history.some(r => r.accuracy >= 99) },
      { id: "perfect", title: "Perfect Run", desc: "100% accuracy in a test", unlocked: history.some(r => r.accuracy === 100) },
      { id: "speed", title: "Speed Demon", desc: "Reach 80+ WPM", unlocked: bestWpm >= 80 },
      { id: "gm", title: "Grandmaster", desc: "Reach 120+ WPM", unlocked: bestWpm >= 120 },
    ]
  }, [history, bestWpm])

  // --- Chart Data ---
  const chartData = useMemo(() => {
    const lastResults = [...history].reverse().slice(-15)
    return lastResults.map((r, i) => ({ x: i, y: r.wpm, accuracy: r.accuracy }))
  }, [history])

  // --- Heatmap Data ---
  const totalErrorKeys = useMemo(() => {
    const errorCounts: Record<string, number> = {}
    history.forEach((run) => {
      if (run.errorKeys) {
        Object.entries(run.errorKeys).forEach(([key, count]) => {
          const normalized = key.toLowerCase()
          errorCounts[normalized] = (errorCounts[normalized] || 0) + count
        })
      }
    })
    return errorCounts
  }, [history])

  // --- Strengths & Weaknesses Key Stats ---
  const strengthsAndWeaknesses = useMemo(() => {
    const list: Array<{ key: string; accuracy: number; attempts: number }> = []
    Object.values(keyStats).forEach((stats) => {
      if (stats.totalAttempts >= 5) {
        list.push({
          key: stats.key.toUpperCase(),
          accuracy: Math.round((stats.totalCorrect / stats.totalAttempts) * 100),
          attempts: stats.totalAttempts,
        })
      }
    })

    const sortedByAcc = [...list].sort((a, b) => b.accuracy - a.accuracy)
    const strongest = sortedByAcc.slice(0, 3)
    const weakest = [...sortedByAcc].reverse().slice(0, 3)

    return { strongest, weakest }
  }, [keyStats])

  if (!mounted) {
    return (
      <Container size="6xl" className="py-8 text-center animate-pulse">
        <div className="h-8 w-48 bg-surface-secondary rounded mx-auto mb-8" />
        <div className="h-64 bg-surface-secondary rounded-[20px] mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-32 mb-8" />
      </Container>
    )
  }

  return (
    <Container size="6xl" className="py-6 space-y-8 animate-fade-in font-sans select-none">
      {/* Page Header */}
      <div className="border-b border-border/20 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Performance Dashboard</h2>
        <p className="text-xs text-text-tertiary mt-1">
          Session history, typing performance, achievements, and layout analytics.
        </p>
      </div>

      {/* Section 1: Hero Card */}
      <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 hover:scale-[1.01] hover:bg-surface/65 active:scale-[0.99] transition-all duration-300 shadow-sm font-sans w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        
        {/* Left: Avatar, Username, Rank */}
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-[0_4px_12px_rgba(10,132,255,0.15)] shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="space-y-1 text-left">
            <h3 className="text-lg font-bold text-text-primary">Sayandip Roy</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-wider leading-none">
                {rankInfo.name}
              </span>
              <span className="text-xs text-text-secondary font-semibold">
                Level {level}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-text-tertiary block leading-none tracking-tight pt-0.5 font-sans">
              {blockString} <span className="tabular-nums">{progressPercent}%</span> to Next Level
            </span>
          </div>
        </div>

        {/* Right: Level Progress Ring */}
        <div className="flex items-center gap-4 relative z-10 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 border-border/10 pt-4 md:pt-0">
          <div className="text-right flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary font-sans">
              Typing Stats
            </span>
            <span className="text-xs text-text-secondary font-medium mt-0.5 font-sans">
              {history.length} total sessions &middot; {percentile}
            </span>
          </div>
          <CircularProgress percent={progressPercent} size={54} strokeWidth={5} className="text-accent flex-shrink-0" />
        </div>
      </div>

      {/* Stats Cards Grid (Apple Fitness style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 flex flex-col justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface/65 active:scale-[0.99] transition-all duration-300 shadow-sm">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block font-sans">
            Best Speed
          </span>
          <div className="flex flex-col mt-4 font-sans">
            <span className="text-3xl font-bold text-accent tracking-tight tabular-nums font-sans">
              {bestWpm}
            </span>
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5 font-sans">
              Words Per Min
            </span>
          </div>
        </div>

        <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 flex flex-col justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface/65 active:scale-[0.99] transition-all duration-300 shadow-sm">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block font-sans">
            Average Speed
          </span>
          <div className="flex flex-col mt-4 font-sans">
            <span className="text-3xl font-bold text-text-primary tracking-tight tabular-nums font-sans">
              {averageWpm}
            </span>
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5 font-sans">
              Words Per Min
            </span>
          </div>
        </div>

        <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 flex items-center justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface/65 active:scale-[0.99] transition-all duration-300 shadow-sm group">
          <div className="flex flex-col justify-between h-full font-sans">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block font-sans">
              Avg Accuracy
            </span>
            <div className="flex flex-col mt-2 font-sans">
              <span className="text-3xl font-bold text-text-primary tracking-tight tabular-nums group-hover:text-accent transition-colors font-sans">
                {averageAccuracy}%
              </span>
              <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5 font-sans">
                Accuracy Score
              </span>
            </div>
          </div>
          <CircularProgress percent={averageAccuracy} size={48} strokeWidth={4.5} className="text-accent flex-shrink-0" />
        </div>

        <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 flex flex-col justify-between min-h-[120px] hover:scale-[1.02] hover:bg-surface/65 active:scale-[0.99] transition-all duration-300 shadow-sm">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block font-sans">
            Daily Streak
          </span>
          <div className="flex flex-col mt-4 font-sans">
            <span className="text-3xl font-bold text-text-primary tracking-tight tabular-nums font-sans">
              {streak} <span className="text-xs text-text-tertiary font-semibold font-sans">days</span>
            </span>
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5 font-sans">
              Activity Streak
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Performance Overview Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WpmTrendChart data={chartData} />
        <AccuracyTrendChart data={chartData} />
      </div>

      {/* Section 3: Keyboard Heatmap & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Heatmap (8 cols) */}
        <div className="md:col-span-8">
          <KeyboardHeatmap errorKeys={totalErrorKeys} />
        </div>
        
        {/* Strengths & Weaknesses (4 cols) */}
        <div className="md:col-span-4 bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 flex flex-col justify-between gap-6 font-sans">
          {/* Strongest Keys */}
          <div>
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block mb-3 font-sans">
              Strongest Keys
            </span>
            {strengthsAndWeaknesses.strongest.length === 0 ? (
              <span className="text-xs text-text-muted font-sans">Not enough data.</span>
            ) : (
              <GroupedList>
                {strengthsAndWeaknesses.strongest.map((item) => (
                  <GroupedListItem
                    key={item.key}
                    title={item.key}
                    className="py-2"
                    rightElement={
                      <span className="text-xs font-bold text-correct tabular-nums font-sans">
                        {item.accuracy}% Acc
                      </span>
                    }
                  />
                ))}
              </GroupedList>
            )}
          </div>

          {/* Weakest Keys */}
          <div>
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block mb-3 font-sans">
              Weakest Keys
            </span>
            {strengthsAndWeaknesses.weakest.length === 0 ? (
              <span className="text-xs text-text-muted font-sans">Not enough data.</span>
            ) : (
              <GroupedList>
                {strengthsAndWeaknesses.weakest.map((item) => (
                  <GroupedListItem
                    key={item.key}
                    title={item.key}
                    className="py-2"
                    destructive
                    rightElement={
                      <span className="text-xs font-bold text-incorrect tabular-nums font-sans">
                        {item.accuracy}% Acc
                      </span>
                    }
                  />
                ))}
              </GroupedList>
            )}
          </div>
        </div>
      </div>

      {/* Achievements row */}
      <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 flex flex-col">
        <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary mb-4 font-sans">
          Achievements
        </span>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/20 -mx-1 px-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border flex-shrink-0 min-w-[160px] max-w-[220px] transition-all duration-300 hover:scale-[1.03] hover:bg-surface/60 active:scale-[0.98] ${
                ach.unlocked
                  ? "bg-accent/5 border-accent/20 shadow-[0_4px_12px_rgba(10,132,255,0.05)]"
                  : "bg-surface/10 border-border/5 opacity-40 grayscale"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                ach.unlocked ? "bg-accent/10 text-accent" : "bg-surface-secondary/50 text-text-muted"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div className="flex flex-col font-sans">
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

      {/* Section 4: History Feed */}
      <div className="pt-2">
        <StatsHistory />
      </div>
    </Container>
  )
}
