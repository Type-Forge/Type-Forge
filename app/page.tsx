"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
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
import { calculateWpm, calculateAccuracy, generateId } from "@/lib/utils"
import BattleView from "@/components/battle/BattleView"
import DrillDashboard from "@/components/drill/DrillDashboard"
import DrillResults from "@/components/drill/DrillResults"
import BattleResults from "@/components/battle/BattleResults"
import { useBattleStore } from "@/stores/battle-store"

/**
 * Main Home Page Dashboard.
 * Coordinates mode selections, timed session countdown interrupts,
 * and page scrolling anchors for post-decryption restarts.
 */
export default function Home() {
  const {
    config,
    status,
    words,
    currentWordIndex,
    correctKeystrokes,
    totalKeystrokes,
    incorrectKeystrokes,
    timeRemaining,
    initSession,
    resetSession,
    finishSession,
  } = useTypingStore()

  const addResult = useStatsStore((s) => s.addResult)
  const selectorRef = useRef<HTMLDivElement>(null)
  const battleStatus = useBattleStore((s) => s.status)
  
  // Track whether an active drill is ongoing (showing typing area vs dashboard)
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

  // Bind key capture events and fetch metrics
  const { wpm, accuracy } = useTypingEngine()

  // Track timed mode countdown (supports standard timed mode & timed drill mode)
  useCountdown(
    config.mode === "timed" ? (config.duration ?? 60) : (config.targetDuration ?? 60),
    () => {
      const finalCorrect = countCorrectChars(words)
      const durationSecs = config.mode === "timed" ? (config.duration ?? 60) : (config.targetDuration ?? 60)
      const wpmVal = calculateWpm(finalCorrect, durationSecs * 1000)
      const accVal = calculateAccuracy(correctKeystrokes, totalKeystrokes)

      addResult({
        id: generateId(),
        timestamp: Date.now(),
        config,
        wpm: wpmVal,
        accuracy: accVal,
        totalKeystrokes,
        correctKeystrokes,
        incorrectKeystrokes,
        duration: durationSecs,
        wordsCompleted: currentWordIndex,
      })

      finishSession()
    },
    status === "running" && (config.mode === "timed" || (config.mode === "drill" && !!config.targetDuration))
  )

  const handleRestart = () => {
    resetSession()
  }

  const handleNewSession = () => {
    resetSession()
    setIsDrillActive(false)
    setTimeout(() => {
      selectorRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Get most recent log entry
  const latestResult = useStatsStore((s) => s.history[0])

  return (
    <div className="w-full flex-1 flex flex-col select-none">
      {/* 1. Centered Header & Config Selector */}
      <Container className="flex flex-col">
        {/* Tagline header */}
        <div className="text-center mb-4">
          <p className="text-center text-[13px] text-text-tertiary font-sans font-medium uppercase tracking-wider">
            Decode &middot; Type &middot; Break the cipher
          </p>
        </div>

        {/* Mode configurations selector */}
        <div
          ref={selectorRef}
          className={`mb-2 transition-opacity duration-300 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
        >
          <ModeSelector onSelect={initSession} currentConfig={config} />
        </div>

        {/* Battle Selector / Countdown OR Drill Dashboard */}
        <div
          className={`transition-opacity duration-300 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
        >
          {config.mode === "battle" ? (
            <div className="w-full">
              <BattleView />
            </div>
          ) : config.mode === "drill" && !isDrillActive ? (
            <DrillDashboard onStartDrill={() => setIsDrillActive(true)} />
          ) : null}
        </div>
      </Container>

      {/* 2. Full Width Typing Area */}
      <div
        className={`w-full transition-opacity duration-300 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
      >
        {/* Render TypingArea for words, timed, active drill, or active battle race */}
        {((config.mode === "words" || config.mode === "timed") ||
          (config.mode === "drill" && isDrillActive) ||
          (config.mode === "battle" && (battleStatus === "racing" || battleStatus === "finished"))) && (
          <Container size="7xl" className="py-4">
            <TypingArea />
          </Container>
        )}
      </div>

      {/* 3. Centered StatsBar & Post-Session Results */}
      <Container className="flex flex-col mt-4">
        {/* Live ticking stats bar */}
        {status === "running" && (
          <StatsBar
            wpm={wpm}
            accuracy={accuracy}
            time={config.mode === "battle" ? null : timeRemaining}
            mode={config.mode}
          />
        )}

        {/* Post-session results display */}
        <AnimatePresence>
          {status === "finished" && latestResult && (
            config.mode === "drill" ? (
              <DrillResults
                key="drill-results"
                result={latestResult}
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
