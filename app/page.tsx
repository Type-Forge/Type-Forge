"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useTypingStore } from "@/stores/typing-store"
import { useStatsStore } from "@/stores/stats-store"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { useCountdown } from "@/hooks/useCountdown"
import Container from "@/components/ui/Container"
import ModeSelector from "@/components/ui/ModeSelector"
import TypingArea from "@/components/typing/TypingArea"
import StatsBar from "@/components/stats/StatsBar"
import ResultsCard from "@/components/stats/ResultsCard"
import StatsHistory from "@/components/stats/StatsHistory"
import { countCorrectChars } from "@/engine/typing-engine"
import { calculateWpm, calculateAccuracy, generateId, computeSessionTimelineAndErrors } from "@/lib/utils"
import { playClickSound } from "@/lib/audio"
import BattleView from "@/components/battle/BattleView"
import DrillDashboard from "@/components/drill/DrillDashboard"
import DrillResults from "@/components/drill/DrillResults"
import BattleResults from "@/components/battle/BattleResults"
import YoloDashboard from "@/components/yolo/YoloDashboard"
import YoloResults from "@/components/yolo/YoloResults"
import { useBattleStore } from "@/stores/battle-store"
import { useYoloStore } from "@/stores/yolo-store"

/**
 * Main Home Page Dashboard.
 * Optimized: uses granular Zustand selectors so the page only re-renders on
 * status/config/mode changes — NOT on every keystroke (words/letterIndex changes).
 */
export default function Home() {
  // Granular subscriptions — only what this component actually renders/reacts to
  const status = useTypingStore((s) => s.status)
  const config = useTypingStore((s) => s.config)
  const timeRemaining = useTypingStore((s) => s.timeRemaining)
  const initSession = useTypingStore((s) => s.initSession)
  const resetSession = useTypingStore((s) => s.resetSession)
  const finishSession = useTypingStore((s) => s.finishSession)

  const addResult = useStatsStore((s) => s.addResult)
  const latestResult = useStatsStore((s) => s.history[0])
  const selectorRef = useRef<HTMLDivElement>(null)
  const battleStatus = useBattleStore((s) => s.status)

  const [isDrillActive, setIsDrillActive] = useState(false)

  // Initialize default session on mount
  useEffect(() => {
    initSession({ mode: "words", wordCount: 25 })
  }, [initSession])

  // Reset drill active state if mode is switched
  useEffect(() => {
    if (config.mode !== "drill") {
      setIsDrillActive(false)
    }
  }, [config.mode])

  // Bind key capture events and fetch live metrics
  const { wpm, accuracy } = useTypingEngine()

  // Timed countdown — reads words/keystrokes from getState() to avoid subscriptions here
  useCountdown(
    config.mode === "timed" ? (config.duration ?? 60) : (config.targetDuration ?? 60),
    () => {
      const s = useTypingStore.getState()
      const durationSecs = config.mode === "timed" ? (config.duration ?? 60) : (config.targetDuration ?? 60)
      const finalCorrect = countCorrectChars(s.words)
      const wpmVal = calculateWpm(finalCorrect, durationSecs * 1000)
      const accVal = calculateAccuracy(s.correctKeystrokes, s.totalKeystrokes)

      const { timeline, errorKeys } = computeSessionTimelineAndErrors(
        s.keystrokes,
        s.startTime || Date.now(),
        durationSecs
      )

      addResult({
        id: generateId(),
        timestamp: Date.now(),
        config,
        wpm: wpmVal,
        accuracy: accVal,
        totalKeystrokes: s.totalKeystrokes,
        correctKeystrokes: s.correctKeystrokes,
        incorrectKeystrokes: s.incorrectKeystrokes,
        duration: durationSecs,
        wordsCompleted: s.currentWordIndex,
        timeline,
        errorKeys,
      })

      finishSession()
    },
    status === "running" && (config.mode === "timed" || (config.mode === "drill" && !!config.targetDuration))
  )

  const handleRestart = () => resetSession()

  const handleNewSession = () => {
    resetSession()
    setIsDrillActive(false)
    setTimeout(() => {
      selectorRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return (
    <div className="w-full flex-1 flex flex-col select-none">
      {/* 1. Config Selector */}
      <Container className="flex flex-col">
        <div
          ref={selectorRef}
          className={`mb-2 transition-opacity duration-100 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
        >
          <ModeSelector onSelect={initSession} currentConfig={config} />
        </div>
      </Container>

      {/* 1b. Drill Dashboard */}
      {config.mode === "drill" && !isDrillActive && status !== "finished" && (
        <div className="w-full max-w-6xl mx-auto px-6 md:px-8 pt-0 pb-2 animate-fade-in">
          <DrillDashboard onStartDrill={() => setIsDrillActive(true)} />
        </div>
      )}

      {/* 1c. YOLO Dashboard */}
      {config.mode === "yolo" && status !== "finished" && (
        <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-2 animate-fade-in">
          <YoloDashboard onExit={() => initSession({ mode: "words", wordCount: 25 })} />
        </div>
      )}

      {/* 2. Full Width Typing Area */}
      <div
        className={`w-full transition-opacity duration-100 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
      >
        {((config.mode === "words" || config.mode === "timed") ||
          (config.mode === "drill" && isDrillActive) ||
          (config.mode === "yolo" && status !== "finished") ||
          (config.mode === "battle" && (battleStatus === "racing" || battleStatus === "finished"))) && (
          <Container size="6xl" className="py-4">
            <TypingArea />
          </Container>
        )}
      </div>

      {/* 3. Centered StatsBar & Post-Session Results */}
      <Container className="flex flex-col mt-4">
        {/* Battle logic runner (no visual — AI ghost caret is in TypingArea) */}
        {config.mode === "battle" && <BattleView />}

        {/* Live stats bar */}
        {status === "running" && (
          <StatsBar
            wpm={wpm}
            accuracy={accuracy}
            time={config.mode === "battle" ? null : timeRemaining}
            mode={config.mode}
          />
        )}

        {/* Post-session results */}
        <AnimatePresence>
          {status === "finished" && latestResult && (
            config.mode === "drill" ? (
              <DrillResults
                key="drill-results"
                result={latestResult}
                onRestart={handleRestart}
                onNewSession={handleNewSession}
              />
            ) : config.mode === "yolo" ? (
              <YoloResults
                key="yolo-results"
                onRestart={handleRestart}
                onNewSession={handleNewSession}
              />
            ) : config.mode === "battle" ? (
              <BattleResults
                key="battle-results"
                result={latestResult}
                onRestart={() => {
                  resetSession()
                  const battleState = useBattleStore.getState()
                  battleState.initBattle(battleState.config.difficulty, battleState.config.wordCount)
                }}
                onNewSession={() => {
                  resetSession()
                  useBattleStore.getState().resetBattle()
                }}
              />
            ) : (
              <ResultsCard
                key="standard-results"
                result={latestResult}
                onRestart={handleRestart}
                onNewSession={handleNewSession}
              />
            )
          )}
        </AnimatePresence>
      </Container>
    </div>
  )
}
