"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useTypingStore } from "@/stores/typing-store"
import { useStatsStore } from "@/stores/stats-store"
import KeyboardBody from "@/components/keyboard/KeyboardBody"
import { playClickSound } from "@/lib/audio"
import WhiteCard from "@/components/ui/WhiteCard"

interface CustomDrillBuilderProps {
  onStartDrill: () => void
  hasHistory?: boolean
  onDeleteClick?: () => void
}

// Memoize KeyboardBody to completely decouple re-renders when other inputs update
const MemoizedKeyboardBody = React.memo(KeyboardBody)

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

/**
 * Clean iOS Toggle Switch styling matching human interface guidelines (Apple HSL Green).
 */
function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <div className="flex items-center justify-between py-4 px-1 select-none">
      <div className="space-y-0.5 pr-4">
        <span className="text-[14px] font-bold text-text-primary block">{label}</span>
        {description && <span className="text-[12px] text-text-secondary block leading-normal">{description}</span>}
      </div>
      <button
        onClick={() => {
          playClickSound("click")
          onChange(!checked)
        }}
        className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center shrink-0 ${
          checked ? "bg-[#34c759]" : "bg-[#e5e5ea] dark:bg-[#39393d]"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <div
          className={`w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ${
            checked ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

export default function CustomDrillBuilder({
  onStartDrill,
  hasHistory = false,
  onDeleteClick,
}: CustomDrillBuilderProps) {
  const initSession = useTypingStore((s) => s.initSession)

  // Retrieve user average WPM to calculate default typing speed target
  const [targetWpm, setTargetWpm] = useState<number>(() => {
    const currentAvg = useStatsStore.getState().averageWpm
    return Math.min(120, Math.max(30, currentAvg > 0 ? Math.round(currentAvg * 1.1) : 70))
  })

  // Local interactive states to isolate updates from parent dashboard
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedBigrams, setSelectedBigrams] = useState<string[]>([])
  const [isSpeedCapEnabled, setIsSpeedCapEnabled] = useState(true)
  const [isTimeLimitEnabled, setIsTimeLimitEnabled] = useState(true)
  const [targetDuration, setTargetDuration] = useState<number>(15) // default to 15 seconds
  const [customInput, setCustomInput] = useState("")
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false)

  // Presets
  const commonBigrams = ["th", "he", "in", "er", "an", "ie", "ei", "ng", "gh", "gr", "go", "ga", "ge", "gi"]
  const keyPresets = [
    { label: "Vowels (A E I O U)", keys: ["a", "e", "i", "o", "u"] },
    { label: "Left Hand Home (A S D F)", keys: ["a", "s", "d", "f"] },
    { label: "Right Hand Home (J K L)", keys: ["j", "k", "l"] },
    { label: "Top Row (Q W E R T Y)", keys: ["q", "w", "e", "r", "t", "y"] },
    { label: "Bottom Row (Z X C V B)", keys: ["z", "x", "c", "v", "b"] },
  ]

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
    const trimmed = customInput.trim().toLowerCase()
    if (!trimmed) return

    if (trimmed.length === 1) {
      if (!selectedKeys.includes(trimmed)) {
        setSelectedKeys((prev) => [...prev, trimmed])
      }
    } else if (trimmed.length === 2) {
      if (!selectedBigrams.includes(trimmed)) {
        setSelectedBigrams((prev) => [...prev, trimmed])
      }
    }
    setCustomInput("")
  }

  const handleStartCustomDrill = () => {
    initSession({
      mode: "drill",
      difficulty: "custom",
      targetWpm: isSpeedCapEnabled ? targetWpm : undefined,
      targetDuration: isTimeLimitEnabled ? targetDuration : undefined,
      targetKeys: selectedKeys,
      targetBigrams: selectedBigrams,
    })
    onStartDrill()
  }

  const activePresetsMatch = (presetKeys: string[]) => {
    return presetKeys.every((k) => selectedKeys.includes(k))
  }

  const toggleKeyPreset = (keys: string[]) => {
    const isAllSelected = activePresetsMatch(keys)
    if (isAllSelected) {
      setSelectedKeys((prev) => prev.filter((k) => !keys.includes(k)))
    } else {
      setSelectedKeys((prev) => {
        const added = keys.filter((k) => !prev.includes(k))
        return [...prev, ...added]
      })
    }
  }

  return (
    <div className="font-sans select-none relative space-y-6">
      {/* iOS Settings Toggles (Switches) and Focus Configurations */}
      <WhiteCard>
          <Switch
            checked={isSpeedCapEnabled}
            onChange={setIsSpeedCapEnabled}
            label="Enable Speed Target"
            description="Allows setting a target WPM limit to pace typing output."
          />
          <Switch
            checked={isTimeLimitEnabled}
            onChange={setIsTimeLimitEnabled}
            label="Enable Time Limit"
            description="Restricts the session duration to an active countdown timer."
          />

          {/* Targets Presets */}
          <div className="py-4 px-1 space-y-3">
            <label className="text-[14px] font-bold text-text-primary block">
              Focus Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {keyPresets.map((preset) => {
                const active = activePresetsMatch(preset.keys)
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      playClickSound("click")
                      toggleKeyPreset(preset.keys)
                    }}
                    className={`h-8 px-4 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.97] ${
                      active
                        ? "bg-accent border-accent text-white"
                        : "bg-surface-secondary/80 border-border/5 text-text-secondary hover:text-text-primary hover:bg-surface-hover/80"
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Focus Bigrams (Transitions) presets */}
          <div className="py-4 px-1 space-y-3">
            <label className="text-[14px] font-bold text-text-primary block">
              Focus Transitions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {commonBigrams.map((bigram) => {
                const active = selectedBigrams.includes(bigram)
                return (
                  <button
                    key={bigram}
                    type="button"
                    onClick={() => {
                      playClickSound("click")
                      toggleBigram(bigram)
                    }}
                    className={`h-7 px-3 rounded-full border text-[11px] font-bold transition-all cursor-pointer select-none active:scale-[0.97] ${
                      active
                        ? "bg-accent border-accent text-white"
                        : "bg-surface-secondary/80 border-border/5 text-text-secondary hover:text-text-primary hover:bg-surface-hover/80"
                    }`}
                  >
                    {bigram.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Manual Target Entry */}
          <div className="py-4 px-1 space-y-3">
            <label className="text-[14px] font-bold text-text-primary block">
              Custom Add
            </label>
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
                placeholder="Type single key or bigram (e.g. th)"
                className="flex-1 h-8.5 bg-surface-secondary border border-border/10 rounded-xl px-3 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => {
                  playClickSound("click")
                  handleAddCustom()
                }}
                className="h-8.5 px-4 rounded-xl border border-border bg-surface-secondary text-text-secondary text-xs font-semibold hover:text-text-primary cursor-pointer active:scale-[0.97] select-none"
              >
                Add
              </button>
            </div>
          </div>

          {/* Keyboard Selector */}
          <div className="py-4 px-1 space-y-3">
            <span className="text-[14px] font-bold text-text-primary block">
              Keyboard Selector
            </span>
            <div className="w-full mt-2">
              <MemoizedKeyboardBody
                selectedKeys={selectedKeys}
                selectedBigrams={selectedBigrams}
                onToggleKey={toggleKey}
              />
            </div>
          </div>

          {/* Target Speed Limit Slider */}
          {isSpeedCapEnabled && (
            <div className="py-4 px-1 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-bold text-text-primary block">
                  Target Speed Limit
                </label>
                <span className="text-accent font-sans font-bold text-[14px] tabular-nums">{targetWpm} WPM</span>
              </div>
              <input
                type="range"
                min={30}
                max={120}
                step={1}
                value={targetWpm}
                onChange={(e) => setTargetWpm(Number(e.target.value))}
                className="w-full h-1 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-accent border border-border/15"
              />
            </div>
          )}

          {/* Target Duration Segment Controller */}
          {isTimeLimitEnabled && (
            <div className="py-4 px-1 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-bold text-text-primary block">
                  Target Duration
                </label>
                <span className="text-accent font-sans font-bold text-[14px] tabular-nums">
                  {targetDuration === 15 ? "15 sec" : targetDuration === 30 ? "30 sec" : `${targetDuration / 60} min`}
                </span>
              </div>
              <div className="bg-surface-secondary p-0.5 rounded-xl flex items-center justify-between border border-border/10 max-w-md">
                {([15, 30, 60, 120, 180] as const).map((secs) => (
                  <button
                    key={secs}
                    type="button"
                    onClick={() => {
                      playClickSound("click")
                      setTargetDuration(secs)
                    }}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer select-none active:scale-[0.97] ${
                      targetDuration === secs
                        ? "bg-surface text-accent shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {secs === 15 ? "15s" : secs === 30 ? "30s" : secs === 60 ? "1m" : secs === 120 ? "2m" : "3m"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Focus & Generate Action Footer */}
          <div className="py-4 px-1 bg-surface-secondary/15 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary">
              <span className="text-[14px] font-bold text-text-primary block shrink-0">
                Active Focus
              </span>
              {selectedKeys.length === 0 && selectedBigrams.length === 0 ? (
                <span className="text-[12px] text-text-secondary italic">No keys or transitions selected</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedKeys.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface border border-border/20 text-[11px] font-bold text-accent"
                    >
                      {k.toUpperCase()}
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound("click")
                          toggleKey(k)
                        }}
                        className="text-text-secondary hover:text-danger ml-1 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedBigrams.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface border border-border/20 text-[11px] font-bold text-accent"
                    >
                      {b.toUpperCase()}
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound("click")
                          toggleBigram(b)
                        }}
                        className="text-text-secondary hover:text-danger ml-1 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound("click")
                setIsStartConfirmOpen(true)
              }}
              disabled={selectedKeys.length === 0 && selectedBigrams.length === 0}
              className="w-full sm:w-auto px-8 h-11 rounded-[12px] bg-gradient-to-r from-accent to-[#0a84ff] text-white font-bold text-[13px] tracking-tight hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(10,132,255,0.25)] disabled:hover:scale-100 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 ease-out active:scale-[0.97] cursor-pointer select-none flex items-center justify-center"
            >
              Generate Drill
            </button>
          </div>

          {/* YOLO Mode Quick Start */}
          <div className="py-4 px-1 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            <div className="space-y-0.5 pr-4 relative group">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-text-primary block">
                  YOLO Mode
                </span>
                <div className="w-4 h-4 rounded-full bg-surface-secondary flex items-center justify-center text-[10px] text-text-secondary cursor-help font-bold select-none border border-border/5">
                  ?
                </div>
                <div className="absolute bottom-full left-0 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform scale-95 group-hover:scale-100 bg-surface border border-border/15 backdrop-blur-xl p-2.5 rounded-xl text-[11px] leading-normal text-text-secondary text-left shadow-lg">
                  <strong>YOLO Mode (Endless Adaptive Training):</strong> Unlocks letters step-by-step. Focuses on your weakest key first and automatically introduces the next letter once you master the current focus (Confidence &ge; 90%).
                </div>
              </div>
              <span className="text-[12px] text-text-secondary block leading-normal">
                Start endless adaptive typing to unlock and master keys dynamically.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound("click")
                initSession({ mode: "yolo" })
              }}
              className="w-full sm:w-auto px-6 h-9 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-text-primary text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer select-none flex items-center justify-center"
            >
              Start YOLO Mode
            </button>
          </div>

          {/* Delete Session */}
          {hasHistory && onDeleteClick && (
            <div className="flex items-center justify-between py-4 px-1 select-none gap-4">
              <div className="space-y-0.5 text-left">
                <span className="text-[14px] font-bold text-[#ff3b30] dark:text-[#ff453a] block">
                  Delete session
                </span>
                <span className="text-[12px] text-text-secondary block leading-normal">
                  Permanently erase all typing ranks, metrics, and mistakes logs.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound("click")
                  onDeleteClick()
                }}
                className="h-8.5 px-4 rounded-xl bg-[#ff3b30] hover:bg-[#e03126] text-white text-xs font-bold transition-all duration-150 active:scale-[0.97] cursor-pointer select-none shadow-sm flex items-center justify-center"
              >
                Delete
              </button>
            </div>
          )}
        </WhiteCard>

      {/* Start Drill Confirmation Modal */}
      <AnimatePresence>
        {isStartConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[4px] pointer-events-auto"
              onClick={() => {
                playClickSound("click")
                setIsStartConfirmOpen(false)
              }}
            />

            {/* Modal Alert Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[270px] bg-[#f2f2f7]/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[14px] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.3)] flex flex-col items-center pointer-events-auto"
            >
              {/* Title */}
              <h4 className="text-[17px] font-bold text-black dark:text-white tracking-tight leading-snug">
                Start Custom Drill?
              </h4>

              {/* Message */}
              <p className="text-[13px] text-black/70 dark:text-white/70 mt-1.5 leading-normal">
                Do you want to start the custom drill with the selected active focus?
              </p>

              {/* Active Focus Display */}
              <div className="flex flex-wrap gap-1 justify-center my-3 max-h-[80px] overflow-y-auto w-full px-1">
                {selectedKeys.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white dark:bg-[#2c2c2e] border border-border/10 text-[10px] font-bold text-accent"
                  >
                    {k.toUpperCase()}
                  </span>
                ))}
                {selectedBigrams.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white dark:bg-[#2c2c2e] border border-border/10 text-[10px] font-bold text-accent"
                  >
                    {b.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Action buttons (horizontal iOS style) */}
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => {
                    playClickSound("click")
                    setIsStartConfirmOpen(false)
                  }}
                  className="flex-1 h-9 rounded-lg bg-[#e5e5ea] dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] text-xs font-semibold hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    playClickSound("click")
                    handleStartCustomDrill()
                    setIsStartConfirmOpen(false)
                  }}
                  className="flex-1 h-9 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer bg-gradient-to-r from-accent to-[#0a84ff] shadow-[0_2px_6px_rgba(10,132,255,0.25)]"
                >
                  Start
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
