"use client"

import React, { useState } from "react"
import { useTypingStore } from "@/stores/typing-store"
import KeyboardBody from "@/components/keyboard/KeyboardBody"
import { playClickSound } from "@/lib/audio"
import WhiteCard from "@/components/ui/WhiteCard"

interface CustomDrillBuilderProps {
  onStartDrill: () => void
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

export default function CustomDrillBuilder({ onStartDrill }: CustomDrillBuilderProps) {
  const initSession = useTypingStore((s) => s.initSession)

  // Local interactive states to isolate updates from parent dashboard
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedBigrams, setSelectedBigrams] = useState<string[]>([])
  const [isSpeedCapEnabled, setIsSpeedCapEnabled] = useState(true)
  const [targetWpm, setTargetWpm] = useState<number>(70)
  const [isTimeLimitEnabled, setIsTimeLimitEnabled] = useState(true)
  const [targetDuration, setTargetDuration] = useState<number>(180) // default 3 mins
  const [customInput, setCustomInput] = useState("")
  const [showKeyboard, setShowKeyboard] = useState(false)

  // Presets
  const commonBigrams = ["th", "he", "in", "er", "an", "ie", "ei", "ng", "gh", "gr", "go", "ga", "ge", "gi"]
  const keyPresets = [
    { label: "Vowels (A E I O U)", keys: ["a", "e", "i", "o", "u"] },
    { label: "Home Row (A S D F)", keys: ["a", "s", "d", "f"] },
    { label: "Left Hand (Q W E A S)", keys: ["q", "w", "e", "a", "s"] },
  ]

  const toggleKey = React.useCallback((key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }, [])

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
      alert("Please select at least one focus key or bigram first.")
      return
    }

    initSession({
      mode: "drill",
      difficulty: "custom",
      targetKeys: selectedKeys,
      targetBigrams: selectedBigrams,
      targetWpm: isSpeedCapEnabled ? targetWpm : undefined,
      targetDuration: isTimeLimitEnabled ? targetDuration : undefined,
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
    <div className="space-y-6 py-2 font-sans select-none">
      {/* Title Header */}
      <div>
        <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">
          Custom Drill Builder
        </span>
        <p className="text-xs text-text-secondary mt-1">
          Manually configure target characters, pacing metrics, and drill timing limits.
        </p>
      </div>

      {/* Screen 3: Settings Grid */}
      <div className="bg-surface-secondary/40 border border-border/10 rounded-[24px] p-6 space-y-6">
        
        {/* iOS Settings Toggles (Switches) */}
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
        </WhiteCard>

        {/* Targets Presets */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
            Focus Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {keyPresets.map((preset) => {
              const active = activePresetsMatch(preset.keys)
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    playClickSound("click")
                    toggleKeyPreset(preset.keys)
                  }}
                  className={`h-8 px-4 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.97] ${
                    active
                      ? "bg-accent border-accent text-white"
                      : "bg-surface border-border/10 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Focus Bigrams (Transitions) presets */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
            Focus Transitions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {commonBigrams.map((bigram) => {
              const active = selectedBigrams.includes(bigram)
              return (
                <button
                  key={bigram}
                  onClick={() => {
                    playClickSound("click")
                    toggleBigram(bigram)
                  }}
                  className={`h-7 px-3 rounded-full border text-[11px] font-bold transition-all cursor-pointer select-none active:scale-[0.97] ${
                    active
                      ? "bg-accent border-accent text-white"
                      : "bg-surface border-border/10 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {bigram.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Manual Target Entry */}
        <div className="space-y-3 border-t border-border/10 pt-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
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
              className="flex-1 h-8.5 bg-surface border border-border/20 rounded-xl px-3 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
            <button
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

        {/* Selection Summary Drawer */}
        {(selectedKeys.length > 0 || selectedBigrams.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary bg-surface border border-border/10 rounded-2xl p-4">
            <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px]">
              Active Focus:
            </span>
            {selectedKeys.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-secondary border border-border/20 text-[11px] font-bold text-accent"
              >
                {k.toUpperCase()}
                <button
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
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-secondary border border-border/20 text-[11px] font-bold text-accent"
              >
                {b.toUpperCase()}
                <button
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

        {/* Collapsible Keyboard Section */}
        <div className="border-t border-border/10 pt-4">
          <button
            onClick={() => {
              playClickSound("click")
              setShowKeyboard(!showKeyboard)
            }}
            className="flex items-center gap-2 text-xs font-bold text-accent hover:underline cursor-pointer select-none active:scale-[0.97] transition-all"
          >
            <span>{showKeyboard ? "Hide Keyboard Selector ▲" : "Focus Letters on Keyboard ▼"}</span>
          </button>

          {showKeyboard && (
            <div className="w-full mt-4 animate-fade-in">
              <MemoizedKeyboardBody selectedKeys={selectedKeys} onToggleKey={toggleKey} />
            </div>
          )}
        </div>

        {/* Sliders Grid */}
        {(isSpeedCapEnabled || isTimeLimitEnabled) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border/10 pt-5">
            {isSpeedCapEnabled ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary uppercase tracking-wider">
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
                  className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent border border-border/15"
                />
              </div>
            ) : <div />}

            {isTimeLimitEnabled ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <span>Target Duration</span>
                  <span className="text-accent font-sans font-bold tabular-nums">
                    {targetDuration === 30 ? "30 sec" : `${targetDuration / 60} min`}
                  </span>
                </div>
                {/* iOS Segment Control */}
                <div className="bg-surface p-0.5 rounded-xl flex items-center justify-between border border-border/10">
                  {([30, 60, 120, 180] as const).map((secs) => (
                    <button
                      key={secs}
                      onClick={() => {
                        playClickSound("click")
                        setTargetDuration(secs)
                      }}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer select-none active:scale-[0.97] ${
                        targetDuration === secs
                          ? "bg-surface-secondary text-accent shadow-sm"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {secs === 30 ? "30s" : secs === 60 ? "1m" : secs === 120 ? "2m" : "3m"}
                    </button>
                  ))}
                </div>
              </div>
            ) : <div />}
          </div>
        )}

        {/* Generate Drill Button */}
        <div className="pt-2">
          <button
            onClick={handleStartCustomDrill}
            disabled={selectedKeys.length === 0 && selectedBigrams.length === 0}
            className="mx-auto block w-fit px-8 h-10 rounded-[10px] bg-accent hover:opacity-95 text-white font-semibold text-xs transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none font-sans"
          >
            Generate Drill
          </button>
        </div>
      </div>
    </div>
  )
}
