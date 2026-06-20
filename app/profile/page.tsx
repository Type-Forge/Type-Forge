"use client"

import { useMemo, useEffect, useState } from "react"
import { useStatsStore } from "@/stores/stats-store"
import { useDrillStore } from "@/stores/drill-store"
import Container from "@/components/ui/Container"
import StatsHistory from "@/components/stats/StatsHistory"
import type { SessionResult } from "@/types"
import { GroupedList, GroupedListItem } from "@/components/ui/GroupedList"

function PerformanceTrendChart({ data }: { data: { x: number; y: number; accuracy: number }[] }) {
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

  // Map value to Y coordinate with nice headroom and footroom (zoom out)
  const getWpmY = (val: number) => {
    const minYCoord = paddingY + 15 // top headroom
    const maxYCoord = height - paddingY - 10 // bottom footroom
    const rangeY = maxYCoord - minYCoord
    return maxYCoord - ((val - minWpm) / rangeWpm) * rangeY
  }

  const getAccY = (val: number) => {
    const minYCoord = paddingY + 15 // top headroom
    const maxYCoord = height - paddingY - 10 // bottom footroom
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
    <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 relative group/chart font-sans">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary">
            Performance Trends
          </span>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-accent">
              <span className="w-2.5 h-0.5 bg-accent inline-block rounded" />
              WPM
            </span>
            <span className="flex items-center gap-1 text-correct">
              <span className="w-2.5 h-0.5 bg-correct inline-block rounded" />
              ACCURACY
            </span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
          Last {data.length} sessions
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
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
    <div className="bg-surface/50 backdrop-blur-md border border-border/10 rounded-[20px] p-5 font-sans w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left: Heatmap (8 columns) */}
        <div className="md:col-span-8 flex flex-col items-center justify-center">
          <div className="flex justify-between items-center w-full mb-6">
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary">
              Mistake Heatmap
            </span>
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
              {totalErrors} total key errors
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
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[150px] opacity-0 group-hover:opacity-100 pointer-events-none z-50 bg-surface/95 border border-border/15 backdrop-blur-xl px-2.5 py-1.5 rounded-lg text-[10px] text-text-secondary text-center shadow-lg leading-normal font-sans">
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
      <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-8 text-center animate-pulse">
        <div className="h-8 w-48 bg-surface-secondary rounded mx-auto mb-8" />
        <div className="h-64 bg-surface-secondary rounded-[20px] mb-8" />
        <div className="h-64 bg-surface-secondary rounded-[20px] mb-8" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-6 space-y-8 animate-fade-in font-sans select-none">
      {/* Page Header */}
      <div className="border-b border-border/10 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Profile</h2>
        <p className="text-xs text-text-secondary mt-1">
          View your personal statistics, visual performance trends, and typing history.
        </p>
      </div>

      {/* Section 1: Personal Statistics */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider pl-4">
          Personal Statistics
        </h3>
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
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider pl-4">
          Performance Trends
        </h3>
        <PerformanceTrendChart data={chartData} />
      </div>

      {/* Section 3: Keyboard Heatmap */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider pl-4">
          Keyboard Heatmap
        </h3>
        <KeyboardHeatmapWithStats 
          errorKeys={totalErrorKeys} 
          strengthsAndWeaknesses={strengthsAndWeaknesses} 
        />
      </div>

      {/* Section 4: Session History */}
      <StatsHistory />
    </div>
  )
}
