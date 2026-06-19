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
import { calculateWpm, calculateAccuracy, generateId } from "@/lib/utils"
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
  const masteryToast = useYoloStore((s) => s.masteryToast)
  const closeMasteryToast = useYoloStore((s) => s.closeMasteryToast)

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

  // Automatically close mastery toast after 2.5 seconds
  useEffect(() => {
    if (masteryToast && masteryToast.isVisible) {
      const timer = setTimeout(() => {
        closeMasteryToast()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [masteryToast, closeMasteryToast])

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
      {/* 0. Slide-Down Mastery Toast (Apple HIG Style) */}
      <AnimatePresence>
        {masteryToast && masteryToast.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 select-none pointer-events-none"
          >
            <div className="bg-surface/95 dark:bg-[#1c1c1e]/95 border border-border/15 shadow-[0_12px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl rounded-2xl py-3 px-5 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#34c759]/10 border border-[#34c759]/20 flex items-center justify-center text-[#34c759] font-bold">
                  ✓
                </div>
                <div className="text-left font-sans">
                  <h4 className="text-[13px] font-bold text-text-primary tracking-tight">
                    {masteryToast.letter} Mastered!
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-none mt-0.5 font-medium">
                    Confidence: {masteryToast.confidence}% &middot; Next: {masteryToast.nextLetter}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound("click")
                  closeMasteryToast()
                }}
                className="text-text-muted hover:text-text-secondary font-bold text-[14px] cursor-pointer pl-4"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Centered Header & Config Selector */}
      <Container className="flex flex-col">
        <div className="text-center mb-4">
          <p className="text-center text-[13px] text-text-tertiary font-sans font-medium uppercase tracking-wider">
            Decode &middot; Type &middot; Break the cipher
          </p>
        </div>

        <div
          ref={selectorRef}
          className={`mb-2 transition-opacity duration-100 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
        >
          <ModeSelector onSelect={initSession} currentConfig={config} />
        </div>
      </Container>

      {/* 1b. Drill Dashboard */}
      {config.mode === "drill" && !isDrillActive && status !== "finished" && (
        <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-2 animate-fade-in">
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
