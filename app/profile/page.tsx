"use client"

import { useMemo, useEffect, useState } from "react"
import { useStatsStore } from "@/stores/stats-store"
import { useDrillStore } from "@/stores/drill-store"
import Container from "@/components/ui/Container"
import StatsHistory from "@/components/stats/StatsHistory"
import type { SessionResult } from "@/types"
import { GroupedList, GroupedListItem } from "@/components/ui/GroupedList"
import WhiteCard from "@/components/ui/WhiteCard"

function PerformanceTrendChart({ data }: { data: { x: number; y: number; accuracy: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length < 2) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-text-tertiary text-xs bg-surface-secondary/20 border border-border/10 rounded-[20px] p-6 text-center select-none font-sans">
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
        <span>Complete at least 2 sessions to visualize WPM and Accuracy trends.</span>
      </div>
    )
  }

  const wpmValues = data.map(d => d.y)
  const accValues = data.map(d => d.accuracy)

  const maxWpm = Math.max(...wpmValues, 100)
  const minWpm = Math.min(...wpmValues, 20)
  const rangeWpm = maxWpm - minWpm || 1

  const maxAcc = 100
  const minAcc = Math.min(...accValues, 80)
  const rangeAcc = maxAcc - minAcc || 1

  const width = 600
  const height = 180
  const paddingX = 25
  const paddingY = 20

  // Zoomed-out map value to Y coordinate (added more top headroom to prevent data/tooltip clipping)
  const getWpmY = (val: number) => {
    const minYCoord = paddingY + 35 // Increased top headroom
    const maxYCoord = height - paddingY - 10
    const rangeY = maxYCoord - minYCoord
    return maxYCoord - ((val - minWpm) / rangeWpm) * rangeY
  }

  const getAccY = (val: number) => {
    const minYCoord = paddingY + 35 // Increased top headroom
    const maxYCoord = height - paddingY - 10
    const rangeY = maxYCoord - minYCoord
    return maxYCoord - ((val - minAcc) / rangeAcc) * rangeY
  }

  const wpmPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
    const y = getWpmY(d.y)
    return { x, y }
  })

  const accPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
    const y = getAccY(d.accuracy)
    return { x, y }
  })

  const wpmPathD = wpmPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  }, "")

  const accPathD = accPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  }, "")

  const wpmAreaD = `${wpmPathD} L ${wpmPoints[wpmPoints.length - 1].x} ${height - paddingY} L ${wpmPoints[0].x} ${height - paddingY} Z`

  return (
    <div className="p-1 relative group/chart font-sans">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-accent">
            <span className="w-2.5 h-0.5 bg-accent inline-block rounded" />
            WPM (Speed)
          </span>
          <span className="flex items-center gap-1 text-correct">
            <span className="w-2.5 h-0.5 bg-correct inline-block rounded" />
            ACCURACY
          </span>
        </div>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
          Last {data.length} sessions
        </span>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} className="stroke-border/10" strokeDasharray="4" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} className="stroke-border/10" strokeDasharray="4" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="stroke-border/10" />

          {/* Hover Vertical Guide Line */}
          {hoveredIndex !== null && (
            <line
              x1={wpmPoints[hoveredIndex].x}
              y1={paddingY}
              x2={wpmPoints[hoveredIndex].x}
              y2={height - paddingY}
              className="stroke-border/30"
              strokeWidth="1.5"
              strokeDasharray="3"
            />
          )}

          {/* WPM Area under the line */}
          <path d={wpmAreaD} fill="url(#chart-gradient)" className="opacity-[0.06]" />

          {/* WPM Sparkline Path */}
          <path
            d={wpmPathD}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Accuracy Sparkline Path */}
          <path
            d={accPathD}
            fill="none"
            stroke="var(--color-correct)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Invisible interactive hover bands */}
          {wpmPoints.map((p, i) => (
            <g key={i}>
              {hoveredIndex === i && (
                <>
                  <circle cx={wpmPoints[i].x} cy={wpmPoints[i].y} r="5.5" className="fill-bg stroke-accent" strokeWidth="2" />
                  <circle cx={accPoints[i].x} cy={accPoints[i].y} r="5.5" className="fill-bg stroke-correct" strokeWidth="2" />
                </>
              )}
              <rect
                x={p.x - (width / (data.length - 1)) / 2}
                y={paddingY}
                width={width / (data.length - 1)}
                height={height - paddingY * 2}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer animate-none"
              />
            </g>
          ))}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Combined Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute bg-surface/95 border border-border/15 backdrop-blur-md rounded-xl p-2.5 px-3 shadow-lg flex flex-col gap-1 pointer-events-none select-none text-[11px] z-10 transition-all duration-75 font-sans min-w-[100px]"
            style={{
              left: `${(wpmPoints[hoveredIndex].x / width) * 100}%`,
              top: `${(Math.min(wpmPoints[hoveredIndex].y, accPoints[hoveredIndex].y) / height) * 100 - 15}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <span className="font-bold text-accent font-sans leading-none">{data[hoveredIndex].y} WPM</span>
            <span className="font-bold text-correct font-sans leading-none">{data[hoveredIndex].accuracy}% ACC</span>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[9px] text-text-tertiary font-bold uppercase tracking-wider px-2 mt-3 font-sans">
        <span>WPM Min/Max: {minWpm}/{maxWpm}</span>
        <span>Accuracy Avg: {Math.round(accValues.reduce((a,b)=>a+b,0)/accValues.length)}%</span>
        <span>WPM Avg: {Math.round(wpmValues.reduce((a,b)=>a+b,0)/wpmValues.length)}</span>
      </div>
    </div>
  )
}

function KeyboardHeatmapWithStats({
  errorKeys,
  strengthsAndWeaknesses,
}: {
  errorKeys: Record<string, number>
  strengthsAndWeaknesses: {
    strongest: Array<{ key: string; accuracy: number; attempts: number }>
    weakest: Array<{ key: string; accuracy: number; attempts: number }>
  }
}) {
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
    <div className="p-1 font-sans w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left: Heatmap (8 columns) */}
        <div className="md:col-span-8 flex flex-col items-center justify-center">
          <div className="flex justify-between items-center w-full mb-6">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Mistake Heatmap ({totalErrors} total errors)
            </span>
          </div>

          <div className="flex flex-col gap-1.5 w-full max-w-md select-none">
            {keyboardRows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 w-full">
                {row.map((char) => {
                  const count = errorKeys[char.toLowerCase()] ?? 0
                  const tooltipText = count > 0
                    ? `${count} mistake${count > 1 ? "s" : ""} on key ${char.toUpperCase()}`
                    : `No mistakes on key ${char.toUpperCase()}`
                  return (
                    <div className="relative group" key={char}>
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-sans border transition-colors ${getKeyHeatmapStyle(
                          char
                        )}`}
                      >
                        {char.toUpperCase()}
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[150px] opacity-0 group-hover:opacity-100 pointer-events-none z-50 bg-surface/95 border border-border/15 backdrop-blur-xl px-2.5 py-1.5 rounded-lg text-[10px] text-text-secondary text-center shadow-lg leading-normal font-sans font-semibold">
                        {tooltipText}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Key Stats Lists (4 columns) */}
        <div className="md:col-span-4 flex flex-col justify-between gap-6 border-t md:border-t-0 md:border-l border-border/10 pt-6 md:pt-0 md:pl-6">
          {/* Strongest Keys */}
          <div>
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block mb-3">
              Strongest Keys
            </span>
            {strengthsAndWeaknesses.strongest.length === 0 ? (
              <span className="text-xs text-text-muted">Not enough data.</span>
            ) : (
              <GroupedList>
                {strengthsAndWeaknesses.strongest.map((item) => (
                  <GroupedListItem
                    key={item.key}
                    title={item.key}
                    className="py-2"
                    rightElement={
                      <span className="text-xs font-bold text-correct tabular-nums">
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
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block mb-3">
              Weakest Keys
            </span>
            {strengthsAndWeaknesses.weakest.length === 0 ? (
              <span className="text-xs text-text-muted">Not enough data.</span>
            ) : (
              <GroupedList>
                {strengthsAndWeaknesses.weakest.map((item) => (
                  <GroupedListItem
                    key={item.key}
                    title={item.key}
                    className="py-2"
                    destructive
                    rightElement={
                      <span className="text-xs font-bold text-incorrect tabular-nums">
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
    </div>
  )
}

function ActivityCalendar({ history }: { history: SessionResult[] }) {
  const days = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0) // Normalize to noon to avoid DST/timezone shift issues
    const endDate = new Date(today)
    // Align to the Saturday of the current week
    endDate.setDate(today.getDate() + (6 - today.getDay()))

    // Start date is Sunday of 26 weeks ago (endDate - 181 days)
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - 181)

    const list: Date[] = []
    const temp = new Date(startDate)
    for (let i = 0; i < 182; i++) {
      list.push(new Date(temp))
      temp.setDate(temp.getDate() + 1)
    }
    return list
  }, [history])

  const activityMap = useMemo(() => {
    const counts: Record<string, number> = {}
    history.forEach((run) => {
      const dateKey = new Date(run.timestamp).toDateString()
      counts[dateKey] = (counts[dateKey] || 0) + 1
    })
    return counts
  }, [history])

  const monthLabels = useMemo(() => {
    const labels: { index: number; text: string }[] = []
    let lastMonth = -1
    for (let i = 0; i < 26; i++) {
      const day = days[i * 7]
      const currentMonth = day.getMonth()
      if (currentMonth !== lastMonth) {
        labels.push({
          index: i,
          text: day.toLocaleDateString(undefined, { month: "short" }),
        })
        lastMonth = currentMonth
      }
    }
    return labels
  }, [days])

  return (
    <div className="w-full flex flex-col font-sans select-none overflow-x-auto py-2">
      <div className="min-w-[360px] self-start">
        {/* Month Labels */}
        <div className="flex text-[9px] text-text-tertiary font-bold uppercase tracking-wider mb-2 h-4 relative">
          {monthLabels.map((label, idx) => (
            <span
              key={idx}
              className="absolute"
              style={{ left: `${(label.index / 26) * 100}%` }}
            >
              {label.text}
            </span>
          ))}
        </div>

        {/* Grid and Day Labels */}
        <div className="flex gap-2.5">
          {/* Day column */}
          <div className="grid grid-rows-7 text-[8px] font-bold text-text-tertiary/70 uppercase select-none pt-[2px] pb-[2px] pr-1.5 leading-none h-[90px] justify-between">
            <span>Sun</span>
            <span className="invisible">Mon</span>
            <span>Tue</span>
            <span className="invisible">Wed</span>
            <span>Thu</span>
            <span className="invisible">Fri</span>
            <span>Sat</span>
          </div>

          {/* 7 rows by 26 columns grid */}
          <div className="grid grid-flow-col grid-rows-7 gap-1 h-[90px]">
            {days.map((day, idx) => {
              const dateStr = day.toDateString()
              const count = activityMap[dateStr] || 0

              // Premium theme colors based on typing activity counts
              let colorClass = "bg-text-muted/10 dark:bg-white/5 border border-transparent"
              if (count > 0 && count <= 2) colorClass = "bg-accent/25 border border-accent/10"
              else if (count > 2 && count <= 4) colorClass = "bg-accent/55 border border-accent/20"
              else if (count > 4) colorClass = "bg-accent border border-accent-hover/30"

              const tooltipText = count > 0
                ? `${count} session${count > 1 ? "s" : ""} on ${day.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : `No activity on ${day.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`

              return (
                <div className="relative group" key={idx}>
                  <div
                    className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-150 hover:scale-[1.15] ${colorClass}`}
                  />
                  {/* Tooltip Popup using app-standard style */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-max max-w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none z-50 transform scale-95 group-hover:scale-100 transition-all duration-150 bg-surface/95 border border-border/15 backdrop-blur-xl px-2.5 py-1.5 rounded-xl text-[10px] text-text-secondary text-center shadow-lg leading-normal font-sans font-semibold">
                    {tooltipText}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-end items-center gap-1.5 mt-2.5 text-[9px] text-text-tertiary font-bold uppercase tracking-wider pr-1">
          <span>Less</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-text-muted/10 dark:bg-white/5" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-accent/25" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-accent/55" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-accent" />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { history } = useStatsStore()
  const { keyStats } = useDrillStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  const chartData = useMemo(() => {
    const lastResults = [...history].reverse().slice(-15)
    return lastResults.map((r, i) => ({ x: i, y: r.wpm, accuracy: r.accuracy }))
  }, [history])

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

  const statsSummary = useMemo(() => {
    const totalSessions = history.length
    const bestWpm = totalSessions > 0 ? Math.max(...history.map((r) => r.wpm)) : 0
    const avgWpm = totalSessions > 0 ? Math.round(history.reduce((acc, r) => acc + r.wpm, 0) / totalSessions) : 0
    const avgAccuracy = totalSessions > 0 ? Math.round(history.reduce((acc, r) => acc + r.accuracy, 0) / totalSessions) : 0
    return { totalSessions, bestWpm, avgWpm, avgAccuracy }
  }, [history])

  if (!mounted) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-6 animate-pulse font-sans">
        <div className="bg-surface/50 border border-border/10 rounded-[20px] p-6 space-y-6 w-full h-[600px]">
          <div className="border-b border-border/10 pb-5">
            <div className="h-6 w-32 bg-surface-secondary rounded mb-2" />
            <div className="h-4 w-64 bg-surface-secondary rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-surface-secondary rounded" />
            <div className="h-20 w-full bg-surface-secondary rounded" />
            <div className="h-32 w-full bg-surface-secondary rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-6 animate-fade-in font-sans select-none">
      <WhiteCard>
        {/* Main Profile Header */}
        <div className="px-1 py-5 select-none">
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Profile</h2>
          <p className="text-xs text-text-secondary mt-1">
            View your personal statistics, visual performance trends, and typing history.
          </p>
        </div>

        {/* Section 1: Personal Statistics */}
        <div className="py-4">
          <div className="px-1 pb-3 text-[13px] font-bold text-text-secondary select-none">
            Personal Statistics
          </div>
          <GroupedList>
            <GroupedListItem
              title="Best Speed"
              rightElement={
                <span className="text-[14px] font-bold text-accent font-sans tabular-nums">
                  {statsSummary.bestWpm} WPM
                </span>
              }
            />
            <GroupedListItem
              title="Average Speed"
              rightElement={
                <span className="text-[14px] font-bold text-accent font-sans tabular-nums">
                  {statsSummary.avgWpm} WPM
                </span>
              }
            />
            <GroupedListItem
              title="Total Sessions"
              rightElement={
                <span className="text-[14px] font-bold text-accent font-sans tabular-nums">
                  {statsSummary.totalSessions} run{statsSummary.totalSessions !== 1 && "s"}
                </span>
              }
            />
            <GroupedListItem
              title="Average Accuracy"
              rightElement={
                <span className="text-[14px] font-bold text-accent font-sans tabular-nums">
                  {statsSummary.avgAccuracy}%
                </span>
              }
            />
          </GroupedList>
        </div>

        {/* Section 2: Performance Trends */}
        <div className="py-4">
          <div className="px-1 pb-3 text-[13px] font-bold text-text-secondary select-none">
            Performance Trends
          </div>
          <PerformanceTrendChart data={chartData} />
        </div>

        {/* Section 3: Keyboard Heatmap */}
        <div className="py-4">
          <div className="px-1 pb-3 text-[13px] font-bold text-text-secondary select-none">
            Keyboard Heatmap
          </div>
          <KeyboardHeatmapWithStats 
            errorKeys={totalErrorKeys} 
            strengthsAndWeaknesses={strengthsAndWeaknesses} 
          />
        </div>

        {/* Section 4: Activity Logs */}
        <div className="py-4">
          <div className="px-1 pb-3 text-[13px] font-bold text-text-secondary select-none">
            Activity Logs
          </div>
          <ActivityCalendar history={history} />
        </div>

        {/* Section 5: Session History */}
        <div className="py-4">
          <div className="px-1 pb-3 text-[13px] font-bold text-text-secondary select-none">
            Session History
          </div>
          <div className="[&>div:first-child]:mt-0 [&_.mb-6]:mb-4 [&_.border-b]:border-none [&_span.text-xs.font-semibold.text-text-secondary]:hidden">
            <StatsHistory />
          </div>
        </div>
      </WhiteCard>
    </div>
  )
}
