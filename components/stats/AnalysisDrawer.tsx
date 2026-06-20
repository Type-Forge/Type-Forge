"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { SessionResult } from "@/types"
import { playClickSound } from "@/lib/audio"
import { useSettingsStore } from "@/stores/settings-store"
import { useDrillStore } from "@/stores/drill-store"
import { useTypingStore } from "@/stores/typing-store"

interface AnalysisDrawerProps {
  isOpen: boolean
  onClose: () => void
  result: SessionResult
}

function getPerformanceGrade(wpm: number, accuracy: number): { grade: string; label: string; color: string } {
  const score = wpm * (accuracy / 100)
  
  if (accuracy < 75) {
    return { grade: "F", label: "Needs Work", color: "text-incorrect" }
  }
  if (score >= 80 && accuracy >= 95) {
    return { grade: "S", label: "Elite", color: "text-correct font-bold" }
  }
  if (score >= 65 && accuracy >= 93) {
    return { grade: "A+", label: "Excellent", color: "text-accent font-bold" }
  }
  if (score >= 55 && accuracy >= 90) {
    return { grade: "A", label: "Great", color: "text-accent" }
  }
  if (score >= 45 && accuracy >= 85) {
    return { grade: "B+", label: "Strong", color: "text-text-primary" }
  }
  if (score >= 35 && accuracy >= 80) {
    return { grade: "B", label: "Good", color: "text-text-primary" }
  }
  if (score >= 25 && accuracy >= 75) {
    return { grade: "C+", label: "Average", color: "text-text-secondary" }
  }
  if (score >= 15 && accuracy >= 70) {
    return { grade: "C", label: "Fair", color: "text-text-secondary" }
  }
  return { grade: "D", label: "Needs Work", color: "text-incorrect" }
}

function getAccuracyStyle(accuracy: number): { color: string; label?: string } {
  if (accuracy >= 95) return { color: "text-correct", label: "Excellent" }
  if (accuracy >= 90) return { color: "text-accent", label: "Great" }
  if (accuracy >= 85) return { color: "text-text-primary", label: "Good" }
  return { color: "text-incorrect", label: "Needs Work" }
}

export default function AnalysisDrawer({ isOpen, onClose, result }: AnalysisDrawerProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const timeline = result.timeline ?? []
  const errorKeys = result.errorKeys ?? {}

  const isDrill = result.config.mode === "drill"
  const focusKeys = result.config.targetKeys ?? []
  const focusBigrams = result.config.targetBigrams ?? []
  
  // Calculate before/after progression if in drill mode
  const { keyStats } = useDrillStore.getState()
  const keystrokes = useTypingStore.getState().keystrokes

  const focusKeysStats = isDrill ? focusKeys.map((key) => {
    const normalizedKey = key.toLowerCase()
    const stats = keyStats[normalizedKey]
    
    // Count stats for this key in the current session
    const sessionKeystrokes = keystrokes.filter(
      (k) => k.expectedChar.toLowerCase() === normalizedKey
    )
    const sessionCorrect = sessionKeystrokes.filter((k) => k.isCorrect).length
    const sessionAttempts = sessionKeystrokes.length
    
    // Current overall stats
    const currentCorrect = stats ? stats.totalCorrect : 0
    const currentAttempts = stats ? stats.totalAttempts : 0
    const currentAcc = currentAttempts > 0
      ? Math.round((currentCorrect / currentAttempts) * 100)
      : 100
      
    // Previous overall stats
    const prevCorrect = Math.max(0, currentCorrect - sessionCorrect)
    const prevAttempts = Math.max(0, currentAttempts - sessionAttempts)
    
    // Default starting point is 85% if they had no prior attempts
    const prevAcc = prevAttempts > 0
      ? Math.round((prevCorrect / prevAttempts) * 100)
      : 85
      
    const diff = currentAcc - prevAcc
    
    return { key, prevAcc, currentAcc, diff }
  }) : []

  // 1. Calculations for WPM Chart
  const wpmPoints = timeline.map(t => t.wpm)
  const maxWpm = Math.max(80, ...wpmPoints, result.wpm)
  const minWpm = Math.min(10, ...wpmPoints)
  const rangeWpm = maxWpm - minWpm || 1
  
  // 2. Calculations for Accuracy Chart
  const accPoints = timeline.map(t => t.accuracy)
  const maxAcc = 100
  const minAcc = Math.min(80, ...accPoints)
  const rangeAcc = maxAcc - minAcc || 1

  const width = 400
  const height = 120
  const paddingX = 15
  const paddingY = 15

  // Map value to Y coordinate with nice headroom and footroom (zoom out)
  const getWpmY = (val: number) => {
    const minYCoord = paddingY + 12 // top headroom
    const maxYCoord = height - paddingY - 10 // bottom footroom
    const rangeY = maxYCoord - minYCoord
    return maxYCoord - ((val - minWpm) / rangeWpm) * rangeY
  }

  const getAccY = (val: number) => {
    const minYCoord = paddingY + 12 // top headroom
    const maxYCoord = height - paddingY - 10 // bottom footroom
    const rangeY = maxYCoord - minYCoord
    return maxYCoord - ((val - minAcc) / rangeAcc) * rangeY
  }

  const wpmPointsSvg = timeline.map((t, i) => {
    const x = paddingX + (i / (timeline.length - 1)) * (width - paddingX * 2)
    const y = getWpmY(t.wpm)
    return { x, y }
  })

  const accPointsSvg = timeline.map((t, i) => {
    const x = paddingX + (i / (timeline.length - 1)) * (width - paddingX * 2)
    const y = getAccY(t.accuracy)
    return { x, y }
  })

  const wpmPathD = wpmPointsSvg.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }, "")

  const accPathD = accPointsSvg.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }, "")

  const wpmAreaD = wpmPointsSvg.length > 0
    ? `${wpmPathD} L ${wpmPointsSvg[wpmPointsSvg.length - 1].x.toFixed(1)} ${(height - paddingY).toFixed(1)} L ${wpmPointsSvg[0].x.toFixed(1)} ${(height - paddingY).toFixed(1)} Z`
    : ""

  // Keyboard layout for Error Heatmap
  const keyboardRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"]
  ]

  // Get total errors to scale heatmap shades
  const totalErrors = Object.values(errorKeys).reduce((sum, v) => sum + v, 0)

  const getKeyHeatmapStyle = (key: string) => {
    const count = errorKeys[key.toLowerCase()] ?? 0
    if (count === 0) {
      return "bg-surface-secondary/40 text-text-secondary border border-border/10"
    }
    
    // Scale color density based on error counts
    if (count === 1) {
      return "bg-incorrect/15 text-incorrect border border-incorrect/30 font-bold"
    }
    if (count === 2) {
      return "bg-incorrect/30 text-incorrect border border-incorrect/50 font-bold"
    }
    return "bg-incorrect/70 text-white border border-incorrect font-bold shadow-sm"
  }

  // Generates SVG Path for line charts
  const generateSvgPath = (points: number[], minVal: number, maxVal: number, width: number, height: number) => {
    if (points.length < 2) return ""
    const step = width / (points.length - 1)
    const valRange = maxVal - minVal || 1
    
    return points.map((p, idx) => {
      const x = idx * step
      const y = height - ((p - minVal) / valRange) * height
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(" ")
  }

  // Generates Area Path for gradient fill below lines
  const generateSvgAreaPath = (points: number[], minVal: number, maxVal: number, width: number, height: number) => {
    if (points.length < 2) return ""
    const step = width / (points.length - 1)
    const valRange = maxVal - minVal || 1
    
    const linePath = points.map((p, idx) => {
      const x = idx * step
      const y = height - ((p - minVal) / valRange) * height
      return `L ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(" ")

    const firstX = 0
    const firstY = height - ((points[0] - minVal) / valRange) * height
    const lastX = width
    
    return `M ${firstX.toFixed(1)} ${height.toFixed(1)} L ${firstX.toFixed(1)} ${firstY.toFixed(1)} ${linePath} L ${lastX.toFixed(1)} ${height.toFixed(1)} Z`
  }

  const gradeInfo = getPerformanceGrade(result.wpm, result.accuracy)
  const accStyle = getAccuracyStyle(result.accuracy)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex flex-col justify-end pointer-events-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[3px] pointer-events-auto"
            onClick={() => {
              playClickSound("click")
              onClose()
            }}
          />

          {/* iOS Slide-up Analysis Drawer */}
          <motion.div
            initial={reducedMotion ? { y: 0, opacity: 0 } : { y: "100%" }}
            animate={{ y: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { y: "100%" }}
            transition={
              reducedMotion
                ? { duration: 0.15, ease: "easeOut" as const }
                : { type: "spring" as const, damping: 28, stiffness: 250, mass: 0.9 }
            }
            className="relative w-full max-w-xl mx-auto bg-surface/90 border border-border border-b-0 backdrop-blur-[40px] rounded-t-[38px] p-6 pb-10 shadow-[0_-15px_50px_rgba(0,0,0,0.25)] pointer-events-auto flex flex-col max-h-[90vh] overflow-y-auto select-none"
          >
            {/* iOS Drag Handle */}
            <div className="w-10 h-[5px] rounded-full bg-text-tertiary/30 mx-auto mb-5 mt-1 shrink-0" />

            {/* Back/Close Button */}
            <button
              onClick={() => {
                playClickSound("click")
                onClose()
              }}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-black/15 dark:border-white/15 text-text-primary flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold tracking-wide text-accent font-sans block mb-0.5 uppercase">
                Diagnostic Analysis
              </span>
              <h3 className="text-xl font-sans font-bold text-text-primary">
                Session Breakdown
              </h3>
            </div>

            {/* Hero stats layout - WPM & Performance Grade side-by-side */}
            <div className="grid grid-cols-2 divide-x divide-border/10 my-4 font-sans shrink-0">
              {/* Left Column: WPM */}
              <div className="text-center">
                <span className="text-[40px] font-sans font-bold text-text-primary leading-none tracking-tight">
                  {result.wpm}
                </span>
                <span className="block text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-1.5">
                  Speed (WPM)
                </span>
              </div>

              {/* Right Column: Grade */}
              <div className="text-center">
                <span className={`text-[40px] font-sans font-bold leading-none tracking-tight ${gradeInfo.color}`}>
                  {gradeInfo.grade}
                </span>
                <span className="block text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-1.5">
                  Grade: {gradeInfo.label}
                </span>
              </div>
            </div>

            {/* Secondary stats list */}
            <div className="w-full my-4 bg-surface-secondary/50 rounded-2xl border border-border/10 divide-y divide-border/10 overflow-hidden font-sans shrink-0">
              {/* Accuracy Row */}
              <div className="flex items-center justify-between px-4 py-3 text-[14px]">
                <span className="text-text-secondary font-medium">Accuracy</span>
                <div className="flex items-center gap-1.5 font-semibold tabular-nums">
                  {accStyle.label && (
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${accStyle.color}`}>
                      {accStyle.label}
                    </span>
                  )}
                  <span className={accStyle.color}>{result.accuracy}%</span>
                </div>
              </div>
              {/* Time Duration Row */}
              <div className="flex items-center justify-between px-4 py-3 text-[14px]">
                <span className="text-text-secondary font-medium">Time Taken</span>
                <span className="text-text-primary font-semibold tabular-nums">{result.duration.toFixed(1)}s</span>
              </div>
              {/* Characters Correctness Row */}
              <div className="flex items-center justify-between px-4 py-3 text-[14px]">
                <span className="text-text-secondary font-medium">Correct Keys</span>
                <span className="text-text-primary font-semibold tabular-nums">{result.correctKeystrokes} / {result.totalKeystrokes}</span>
              </div>
            </div>

            {/* Timeline Charts Section */}
            <div className="space-y-6 flex-1 mt-4">
              {timeline.length >= 2 ? (
                <div className="bg-surface-secondary/50 border border-border/10 rounded-2xl p-4.5 font-sans relative group/chart">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">
                        Session Timeline
                      </span>
                      <div className="flex items-center gap-2.5 text-[9px] font-bold">
                        <span className="flex items-center gap-1 text-accent">
                          <span className="w-2 h-0.5 bg-accent inline-block rounded" />
                          WPM (Peak: {Math.max(...wpmPoints)} WPM)
                        </span>
                        <span className="flex items-center gap-1 text-correct">
                          <span className="w-2 h-0.5 bg-correct inline-block rounded" />
                          ACCURACY
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                      {result.duration.toFixed(1)}s total
                    </span>
                  </div>

                  <div className="relative w-full overflow-hidden">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                      {/* Horizontal Grid lines */}
                      <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} className="stroke-border/10" strokeDasharray="3" />
                      <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} className="stroke-border/10" strokeDasharray="3" />
                      <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="stroke-border/10" />

                      {/* Hover Vertical Guide Line */}
                      {hoveredIndex !== null && wpmPointsSvg[hoveredIndex] && (
                        <line
                          x1={wpmPointsSvg[hoveredIndex].x}
                          y1={paddingY}
                          x2={wpmPointsSvg[hoveredIndex].x}
                          y2={height - paddingY}
                          className="stroke-border/30"
                          strokeWidth="1.2"
                          strokeDasharray="2"
                        />
                      )}

                      {/* WPM Area */}
                      {wpmAreaD && (
                        <path d={wpmAreaD} fill="url(#timeline-wpm-grad)" className="opacity-[0.06]" />
                      )}

                      {/* WPM Sparkline Path */}
                      {wpmPathD && (
                        <path
                          d={wpmPathD}
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Accuracy Sparkline Path */}
                      {accPathD && (
                        <path
                          d={accPathD}
                          fill="none"
                          stroke="var(--color-correct)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Invisible interactive hover bands */}
                      {wpmPointsSvg.map((p, i) => (
                        <g key={i}>
                          {hoveredIndex === i && accPointsSvg[i] && (
                            <>
                              <circle cx={wpmPointsSvg[i].x} cy={wpmPointsSvg[i].y} r="4" className="fill-bg stroke-accent" strokeWidth="1.5" />
                              <circle cx={accPointsSvg[i].x} cy={accPointsSvg[i].y} r="4" className="fill-bg stroke-correct" strokeWidth="1.5" />
                            </>
                          )}
                          <rect
                            x={p.x - (width / (timeline.length - 1)) / 2}
                            y={paddingY}
                            width={width / (timeline.length - 1)}
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
                        <linearGradient id="timeline-wpm-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" />
                          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Combined Tooltip */}
                    {hoveredIndex !== null && timeline[hoveredIndex] && wpmPointsSvg[hoveredIndex] && accPointsSvg[hoveredIndex] && (
                      <div
                        className="absolute bg-surface/95 border border-border/15 backdrop-blur-md rounded-xl p-2 px-2.5 shadow-lg flex flex-col gap-0.5 pointer-events-none select-none text-[9px] z-10 transition-all duration-75 font-sans min-w-[75px]"
                        style={{
                          left: `${(wpmPointsSvg[hoveredIndex].x / width) * 100}%`,
                          top: `${(Math.min(wpmPointsSvg[hoveredIndex].y, accPointsSvg[hoveredIndex].y) / height) * 100 - 15}%`,
                          transform: 'translate(-50%, -100%)',
                        }}
                      >
                        <span className="font-bold text-accent font-sans leading-none">{timeline[hoveredIndex].wpm} WPM</span>
                        <span className="font-bold text-correct font-sans leading-none">{timeline[hoveredIndex].accuracy}% ACC</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-[9px] text-text-tertiary mt-3 font-sans">
                    <span>Start</span>
                    <span>End ({result.duration.toFixed(1)}s)</span>
                  </div>
                </div>
              ) : (
                <div className="bg-surface-secondary/30 border border-border/10 rounded-2xl p-8 text-center text-xs text-text-tertiary">
                  Timeline data unavailable for this run duration.
                </div>
              )}

              {/* Error Heatmap */}
              <div className="bg-surface-secondary/50 border border-border/10 rounded-2xl p-4.5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider block">
                    Mistake Heatmap
                  </span>
                  <span className="text-xs text-text-tertiary font-medium">
                    {totalErrors} key errors logged
                  </span>
                </div>

                {/* Keyboard layout view */}
                <div className="flex flex-col gap-1 w-full max-w-sm mx-auto select-none mt-2">
                  {keyboardRows.map((row, rIdx) => (
                    <div key={rIdx} className="flex justify-center gap-1 w-full">
                      {row.map((char) => (
                        <div
                          key={char}
                          className={`w-7.5 h-7.5 rounded-md flex items-center justify-center text-[11px] font-sans border transition-colors ${getKeyHeatmapStyle(
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

              {/* Drill focus keys stats inside Drawer */}
              {isDrill && (focusKeys.length > 0 || focusBigrams.length > 0) && (
                <div className="bg-surface-secondary/50 border border-border/10 rounded-2xl p-4.5 text-left space-y-3 font-sans">
                  <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider block">
                    Target Key Stats Post-Drill
                  </span>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {focusKeysStats.map((item) => (
                      <div
                        key={item.key}
                        className="bg-surface border border-border/10 rounded-[16px] p-3 flex flex-col gap-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[14px] text-text-primary">
                            {item.key.toUpperCase()} <span className="text-[10px] font-medium text-text-secondary lowercase">mastery</span>
                          </span>
                          {item.diff !== 0 && (
                            <span className={`text-[10px] font-bold ${item.diff > 0 ? "text-correct" : "text-incorrect"}`}>
                              {item.diff > 0 ? `+${item.diff}%` : `${item.diff}%`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1 text-[12px] text-text-secondary font-medium mt-0.5">
                          <span className="tabular-nums font-semibold">{item.prevAcc}%</span>
                          <span className="text-text-tertiary">&rarr;</span>
                          <span className="tabular-nums font-bold text-accent">{item.currentAcc}%</span>
                        </div>
                      </div>
                    ))}
                    {focusBigrams.map((b) => (
                      <div
                        key={b}
                        className="bg-surface border border-border/10 rounded-[16px] p-3 flex flex-col gap-1 shadow-sm justify-center"
                      >
                        <span className="font-bold text-[14px] text-text-primary">
                          {b.toUpperCase()} <span className="text-[10px] font-medium text-text-secondary lowercase">bigram</span>
                        </span>
                        <span className="text-[12px] text-text-tertiary mt-0.5 font-medium">Transition focused</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Done Button */}
            <button
              onClick={() => {
                playClickSound("click")
                onClose()
              }}
              className="w-full h-12 rounded-2xl bg-accent hover:opacity-90 text-white font-sans text-sm font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm shrink-0 mt-6"
            >
              Back to report
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
