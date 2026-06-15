"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useDrillStore } from "@/stores/drill-store"
import { useTypingStore } from "@/stores/typing-store"
import { calculateKeyWeakness, calculateBigramWeakness, getSuggestedDrills } from "@/engine/drill-engine"

interface DrillDashboardProps {
  onStartDrill: () => void
}

export default function DrillDashboard({ onStartDrill }: DrillDashboardProps) {
  const { keyStats, bigramStats, mistakeRecords, resetStats } = useDrillStore()
  const { initSession } = useTypingStore()

  // Custom Builder State
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedBigrams, setSelectedBigrams] = useState<string[]>([])
  const [targetWpm, setTargetWpm] = useState<number>(70)
  const [targetDuration, setTargetDuration] = useState<number>(180) // 3 mins in seconds
  const [customInput, setCustomInput] = useState("")

  // Quick select presets
  const commonKeysPreset = ["q", "z", "x", "c", "p"]
  const commonBigramsPreset = ["th", "he", "in", "er", "an", "ie", "ei"]

  // --- Calculate Focus Areas (Apple style) ---
  const focusAreas = useMemo(() => {
    const list: Array<{
      type: "key" | "bigram"
      label: string
      accuracy: number
      weakness: number
    }> = []

    // 1. Process keys
    Object.values(keyStats).forEach((stats) => {
      if (stats.totalAttempts > 0) {
        list.push({
          type: "key",
          label: stats.key.toUpperCase(),
          accuracy: Math.round((stats.totalCorrect / stats.totalAttempts) * 100),
          weakness: calculateKeyWeakness(stats),
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

  // --- Suggested Drills ---
  const suggestions = useMemo(() => {
    return getSuggestedDrills(keyStats, bigramStats, mistakeRecords)
  }, [keyStats, bigramStats, mistakeRecords])

  // --- Custom Preset Selection Helpers ---
  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleBigram = (bigram: string) => {
    setSelectedBigrams((prev) =>
      prev.includes(bigram) ? prev.filter((b) => b !== bigram) : [...prev, bigram]
    )
  }

  const handleAddCustom = () => {
    const clean = customInput.trim().toLowerCase()
    if (!clean) return

    if (clean.length === 1 && /^[a-z]$/.test(clean)) {
      if (!selectedKeys.includes(clean)) {
        setSelectedKeys((prev) => [...prev, clean])
      }
    } else if (clean.length === 2 && /^[a-z]{2}$/.test(clean)) {
      if (!selectedBigrams.includes(clean)) {
        setSelectedBigrams((prev) => [...prev, clean])
      }
    }
    setCustomInput("")
  }

  const handleStartCustomDrill = () => {
    if (selectedKeys.length === 0 && selectedBigrams.length === 0) {
      alert("Please select or add at least one focus key or bigram.")
      return
    }

    initSession({
      mode: "drill",
      difficulty: "custom",
      targetKeys: selectedKeys,
      targetBigrams: selectedBigrams,
      targetWpm,
      targetDuration,
    })
    onStartDrill()
  }

  const handleStartSuggestedDrill = (drill: typeof suggestions[0]) => {
    initSession({
      mode: "drill",
      difficulty: drill.difficulty,
      targetKeys: drill.focusKeys,
      targetBigrams: drill.focusBigrams,
    })
    onStartDrill()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-4 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Adaptive Training</h2>
          <p className="text-xs text-text-tertiary mt-1">
            Drill mode analyzes your historical keyboard mistakes and targets your muscle memory flaws.
          </p>
        </div>
        {(focusAreas.length > 0 || mistakePatterns.length > 0) && (
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear your typing weakness profile?")) {
                resetStats()
              }
            }}
            className="text-xs font-semibold text-danger/80 hover:text-danger hover:underline cursor-pointer active:scale-95 transition-transform"
          >
            Clear Profile
          </button>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Focus Areas & Mistake Patterns */}
        <div className="md:col-span-5 space-y-4 flex flex-col">
          {/* Focus Areas Card */}
          <div className="flex-1 bg-surface/50 border border-border/40 rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono">
                  Focus Areas
                </span>
                {focusAreas.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                    Live profile
                  </span>
                )}
              </div>

              {focusAreas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-2xl mb-2">🎯</span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    No weak keys analyzed yet.
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-1 leading-normal max-w-xs">
                    Complete standard Words, Timed, or Battle sessions to generate typing profiles.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {focusAreas.map((area, idx) => {
                    // Decide color indicator
                    const accColor =
                      area.accuracy >= 90
                        ? "bg-success"
                        : area.accuracy >= 80
                        ? "bg-amber-500"
                        : "bg-danger"

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-surface-secondary/40 border border-border/20 rounded-2xl px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-extrabold text-text-primary tracking-wide">
                            {area.label}
                          </span>
                          <span className="text-[10px] text-text-tertiary font-medium capitalize">
                            ({area.type})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-secondary font-bold">
                            {area.accuracy}%
                          </span>
                          <span className={`w-2 h-2 rounded-full ${accColor}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {focusAreas.length > 0 && (
              <p className="text-[10px] text-text-tertiary leading-normal mt-4">
                * Weakness is calculated using combined accuracy penalties and character key release reaction latency.
              </p>
            )}
          </div>

          {/* Mistake Patterns Card */}
          <div className="flex-1 bg-surface/50 border border-border/40 rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono">
                  Typo & Swap Patterns
                </span>
              </div>

              {mistakePatterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-2xl mb-2">⚡</span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Zero confusion patterns.
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-1 leading-normal max-w-xs">
                    Your mistakes (like key swaps `ie` to `ei`) will populate here as you type.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {mistakePatterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-surface-secondary/40 border border-border/20 rounded-2xl px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-danger/90 font-mono">
                          {pat.expected}
                        </span>
                        <span className="text-[10px] text-text-tertiary">→</span>
                        <span className="text-xs font-bold text-text-secondary font-mono">
                          {pat.actual}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-text-tertiary">
                        {pat.count} {pat.count === 1 ? "time" : "times"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {mistakePatterns.length > 0 && (
              <p className="text-[10px] text-text-tertiary leading-normal mt-4">
                * Detecting sequence order inversion swaps helps target letter transition blocks.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Suggested Drills & Custom Builder */}
        <div className="md:col-span-7 space-y-4">
          {/* Suggested Drills Card */}
          <div className="bg-surface/50 border border-border/40 rounded-3xl p-5">
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono block mb-4">
              Suggested Drills
            </span>

            <div className="space-y-3">
              {suggestions.map((drill) => (
                <div
                  key={drill.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-secondary/50 border border-border/20 hover:border-accent/30 transition-all duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-extrabold text-text-primary tracking-wide">
                        {drill.title}
                      </h4>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                        {drill.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal max-w-md">
                      {drill.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartSuggestedDrill(drill)}
                    className="h-8 px-4 rounded-xl bg-accent text-white text-xs font-bold transition-transform cursor-pointer active:scale-95 select-none shrink-0"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Drill Builder Card */}
          <div className="bg-surface/50 border border-border/40 rounded-3xl p-5 space-y-4">
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono block">
              Custom Drill Builder
            </span>

            {/* Target Keys Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-secondary">Focus Letters</label>
              <div className="flex flex-wrap gap-1.5">
                {commonKeysPreset.map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleKey(key)}
                    className={`h-7 px-3 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer select-none active:scale-95 ${
                      selectedKeys.includes(key)
                        ? "bg-accent border-accent text-white"
                        : "bg-surface-secondary border-border/30 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Bigrams Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-secondary">Focus Transitions</label>
              <div className="flex flex-wrap gap-1.5">
                {commonBigramsPreset.map((bigram) => (
                  <button
                    key={bigram}
                    onClick={() => toggleBigram(bigram)}
                    className={`h-7 px-3 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer select-none active:scale-95 ${
                      selectedBigrams.includes(bigram)
                        ? "bg-accent border-accent text-white"
                        : "bg-surface-secondary border-border/30 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {bigram.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual input */}
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                maxLength={2}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value.toLowerCase())}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                placeholder="Custom character or bigram (e.g. th)"
                className="flex-1 h-8 bg-surface-secondary/80 border border-border/30 rounded-xl px-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleAddCustom}
                className="h-8 px-3 rounded-xl border border-border bg-surface-secondary text-text-secondary text-xs font-semibold hover:text-text-primary cursor-pointer active:scale-95 select-none"
              >
                Add
              </button>
            </div>

            {/* Selected Lists Summary */}
            {(selectedKeys.length > 0 || selectedBigrams.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary bg-surface-secondary/40 border border-border/10 rounded-2xl p-3">
                <span className="font-bold">Focus:</span>
                {selectedKeys.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface border border-border/35 text-[10px] font-bold text-accent"
                  >
                    {k.toUpperCase()}
                    <button onClick={() => toggleKey(k)} className="text-text-tertiary hover:text-danger ml-0.5 cursor-pointer font-bold">×</button>
                  </span>
                ))}
                {selectedBigrams.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface border border-border/35 text-[10px] font-bold text-accent"
                  >
                    {b.toUpperCase()}
                    <button onClick={() => toggleBigram(b)} className="text-text-tertiary hover:text-danger ml-0.5 cursor-pointer font-bold">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Dynamic Weights Sliders / Control Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/20 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
                  <span>Target WPM</span>
                  <span className="text-accent font-mono">{targetWpm} WPM</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={120}
                  step={5}
                  value={targetWpm}
                  onChange={(e) => setTargetWpm(Number(e.target.value))}
                  className="w-full h-1 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
                  <span>Target Duration</span>
                  <span className="text-accent font-mono">
                    {targetDuration === 30 ? "30 sec" : `${targetDuration / 60} min`}
                  </span>
                </div>
                {/* iOS segment control for duration */}
                <div className="bg-surface-secondary p-0.5 rounded-xl flex items-center justify-between border border-border/10">
                  {([30, 60, 120, 180] as const).map((secs) => (
                    <button
                      key={secs}
                      onClick={() => setTargetDuration(secs)}
                      className={`flex-1 text-[10px] font-bold py-1 rounded-lg transition-all cursor-pointer select-none ${
                        targetDuration === secs
                          ? "bg-surface text-accent shadow-sm"
                          : "text-text-tertiary hover:text-text-secondary"
                      }`}
                    >
                      {secs === 30 ? "30s" : secs === 60 ? "1m" : secs === 120 ? "2m" : "3m"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartCustomDrill}
              disabled={selectedKeys.length === 0 && selectedBigrams.length === 0}
              className="w-full h-11 rounded-2xl bg-accent text-white font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none font-sans shadow-sm"
            >
              Generate & Start Custom Drill
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
