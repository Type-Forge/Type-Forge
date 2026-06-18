"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useDrillStore } from "@/stores/drill-store"
import { useTypingStore } from "@/stores/typing-store"
import { calculateKeyWeakness, calculateBigramWeakness, getSuggestedDrills } from "@/engine/drill-engine"
import KeyboardBody from "@/components/keyboard/KeyboardBody"
import { playClickSound } from "@/lib/audio"
import AlertModal from "@/components/ui/AlertModal"

interface DrillDashboardProps {
  onStartDrill: () => void
}

export default function DrillDashboard({ onStartDrill }: DrillDashboardProps) {
  const { keyStats, bigramStats, mistakeRecords, resetStats } = useDrillStore()
  const { initSession } = useTypingStore()

  // Tab State
  const [activeTab, setActiveTab] = useState<"adaptive" | "custom">("adaptive")
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Custom Builder State
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedBigrams, setSelectedBigrams] = useState<string[]>([])
  const [targetWpm, setTargetWpm] = useState<number>(70)
  const [targetDuration, setTargetDuration] = useState<number>(180) // 3 mins in seconds
  const [customInput, setCustomInput] = useState("")

  // Quick select presets
  const commonBigramsPreset = ["th", "he", "in", "er", "an", "ie", "ei"]

  // --- Calculate Focus Areas (Apple style) ---
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
    <div className="w-full py-4 animate-fade-in font-sans space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Adaptive Training</h2>
          <p className="text-xs text-text-tertiary mt-1">
            Drill mode analyzes your typing errors and builds custom target training.
          </p>
        </div>
        {(focusAreas.length > 0 || mistakePatterns.length > 0) && (
          <button
            onClick={() => {
              playClickSound("click")
              setIsClearModalOpen(true)
            }}
            className="text-xs font-semibold text-danger/80 hover:text-danger hover:underline cursor-pointer active:scale-[0.97] transition-transform"
          >
            Clear Profile
          </button>
        )}
      </div>

      {/* Segmented Switcher for Tab Mode Selection */}
      <div className="flex justify-center my-2 select-none">
        <div className="bg-surface-secondary p-0.5 rounded-[8px] flex items-center justify-center gap-0.5 border border-border/10 relative">
          <button
            onClick={() => {
              playClickSound("click")
              setActiveTab("adaptive")
            }}
            className={`text-[13px] font-semibold px-4 py-1.5 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              activeTab === "adaptive"
                ? "text-text-primary bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Intelligent Trainer
          </button>
          <button
            onClick={() => {
              playClickSound("click")
              setActiveTab("custom")
            }}
            className={`text-[13px] font-semibold px-4 py-1.5 rounded-[6px] transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              activeTab === "custom"
                ? "text-text-primary bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Custom Drill Builder
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <AnimatePresence mode="wait">
        {activeTab === "adaptive" ? (
          <motion.div
            key="adaptive"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 w-full"
          >
            {/* Typing Profile Analysis Card */}
            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-6 space-y-4">
              <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary font-sans block mb-2">
                Weakness Analysis Profile
              </span>

              {focusAreas.length === 0 && mistakePatterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-text-secondary font-medium leading-relaxed">
                    No weakness metrics analyzed yet
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-1 leading-normal max-w-sm">
                    Complete standard sessions (Words, Timed, or Battle modes) to generate typing data.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Focus Areas List */}
                  <div>
                    <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2.5">Slowest Keys / Transitions</h4>
                    {focusAreas.length === 0 ? (
                      <p className="text-xs text-text-tertiary">No weak keys detected yet.</p>
                    ) : (
                      <div className="divide-y divide-border/10 overflow-hidden">
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
                              className="flex items-center justify-between py-3 text-[14px]"
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
                    )}
                  </div>

                  {/* Mistake Patterns List */}
                  <div>
                    <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2.5">Frequent Typo Patterns</h4>
                    {mistakePatterns.length === 0 ? (
                      <p className="text-xs text-text-tertiary">No typo trends detected yet.</p>
                    ) : (
                      <div className="divide-y divide-border/10 overflow-hidden">
                        {mistakePatterns.map((pat, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-3 text-[14px]"
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
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Drills Card */}
            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-6 space-y-4">
              <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary font-sans block mb-2">
                Recommended Training Drills
              </span>

              <div className="divide-y divide-border/10 overflow-hidden">
                {suggestions.map((drill) => (
                  <div
                    key={drill.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-surface-hover/10 transition-all duration-150 rounded-lg px-2 -mx-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-text-primary tracking-wide">
                          {drill.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-accent/10 text-accent">
                          {drill.difficulty}
                        </span>
                      </div>
                      <p className="text-[12px] text-text-secondary leading-normal max-w-md">
                        {drill.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        playClickSound("click")
                        handleStartSuggestedDrill(drill)
                      }}
                      className="h-8 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all cursor-pointer active:scale-[0.97] select-none shrink-0"
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 w-full"
          >
            {/* Custom Drill Builder Settings Card */}
            <div className="bg-surface-secondary/40 border border-border/10 rounded-[20px] p-6 space-y-6">
                <div>
                  <span className="text-[12px] uppercase font-bold tracking-wider text-text-secondary font-sans block mb-2">
                    Custom Drill Builder
                  </span>
                  <p className="text-xs text-text-tertiary leading-normal">
                    Select your focus targets, manually add custom combinations, and set speed parameters.
                  </p>
                </div>

                {/* Target Bigrams Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Focus Transitions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {commonBigramsPreset.map((bigram) => (
                      <button
                        key={bigram}
                        onClick={() => {
                          playClickSound("click")
                          toggleBigram(bigram)
                        }}
                        className={`h-7 px-3 rounded-full border text-[11px] font-bold transition-all cursor-pointer select-none active:scale-[0.97] ${
                          selectedBigrams.includes(bigram)
                            ? "bg-accent border-accent text-white"
                            : "bg-surface border-border/10 text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {bigram.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual input */}
                <div className="space-y-2 border-t border-border/10 pt-4">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary block">Custom Target</label>
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="text"
                      maxLength={2}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value.toLowerCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          playClickSound("click")
                          handleAddCustom()
                        }
                      }}
                      placeholder="Custom character or bigram (e.g. th)"
                      className="flex-1 h-8 bg-surface-secondary/80 border border-border/30 rounded-xl px-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => {
                        playClickSound("click")
                        handleAddCustom()
                      }}
                      className="h-8 px-3 rounded-xl border border-border bg-surface-secondary text-text-secondary text-xs font-semibold hover:text-text-primary cursor-pointer active:scale-[0.97] select-none"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Lists Summary */}
                {(selectedKeys.length > 0 || selectedBigrams.length > 0) && (
                  <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary bg-surface-secondary/50 border border-border/10 rounded-2xl p-3">
                    <span className="font-bold">Active Targets:</span>
                    {selectedKeys.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-surface border border-border/35 text-[12px] font-bold text-accent"
                      >
                        {k.toUpperCase()}
                        <button
                          onClick={() => {
                            playClickSound("click")
                            toggleKey(k)
                          }}
                          className="text-text-tertiary hover:text-danger ml-0.5 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {selectedBigrams.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-surface border border-border/35 text-[12px] font-bold text-accent"
                      >
                        {b.toUpperCase()}
                        <button
                          onClick={() => {
                            playClickSound("click")
                            toggleBigram(b)
                          }}
                          className="text-text-tertiary hover:text-danger ml-0.5 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dynamic Weights Sliders / Control Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border/20 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[12px] font-bold text-text-secondary uppercase tracking-wider">
                      <span>Target Speed Limit</span>
                      <span className="text-accent font-sans font-bold tabular-nums">{targetWpm} WPM</span>
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
                    <div className="flex items-center justify-between text-[12px] font-bold text-text-secondary uppercase tracking-wider">
                      <span>Target Duration</span>
                      <span className="text-accent font-sans font-bold tabular-nums">
                        {targetDuration === 30 ? "30 sec" : `${targetDuration / 60} min`}
                      </span>
                    </div>
                    {/* iOS segment control for duration */}
                    <div className="bg-surface-secondary p-0.5 rounded-xl flex items-center justify-between border border-border/10">
                      {([30, 60, 120, 180] as const).map((secs) => (
                        <button
                          key={secs}
                          onClick={() => {
                            playClickSound("click")
                            setTargetDuration(secs)
                          }}
                          className={`flex-1 text-[12px] font-bold py-1 rounded-lg transition-all cursor-pointer select-none active:scale-[0.97] ${
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
                  onClick={() => {
                    playClickSound("click")
                    handleStartCustomDrill()
                  }}
                  disabled={selectedKeys.length === 0 && selectedBigrams.length === 0}
                  className="w-full h-11 rounded-2xl bg-accent text-white font-semibold text-xs transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none font-sans shadow-sm"
                >
                  Generate & Start Custom Drill
                </button>
              </div>

              {/* Target Keys Virtual Keyboard Selection */}
              <div className="w-full space-y-2 select-none">
                <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary block px-1">Focus Letters</label>
                <KeyboardBody selectedKeys={selectedKeys} onToggleKey={toggleKey} />
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
