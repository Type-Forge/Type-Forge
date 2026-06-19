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
  const masteryBanner = useYoloStore((s) => s.masteryBanner)
  const closeMasteryBanner = useYoloStore((s) => s.closeMasteryBanner)

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

  // Automatically close mastery banner after 2.5 seconds
  useEffect(() => {
    if (masteryBanner) {
      const timer = setTimeout(() => {
        closeMasteryBanner()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [masteryBanner, closeMasteryBanner])

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
      {/* 0b. Upgraded Full-Width Glassmorphic Mastery Banner */}
      <AnimatePresence>
        {masteryBanner && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: "spring", damping: 20, stiffness: 250 }}
            className="w-full max-w-6xl mx-auto px-6 md:px-8 py-2 relative z-[150] select-none"
          >
            <div className="bg-gradient-to-r from-accent/5 via-[#34c759]/5 to-accent/5 bg-surface/80 dark:bg-[#1c1c1e]/80 border border-[#34c759]/25 shadow-[0_8px_32px_rgba(52,199,89,0.15)] backdrop-blur-xl rounded-[20px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all duration-300">
              <div className="flex items-center gap-4 flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-full bg-[#34c759]/10 border border-[#34c759]/20 flex items-center justify-center text-[22px] text-[#34c759] font-bold shadow-sm shrink-0">
                  ✓
                </div>
                <div className="font-sans">
                  <h3 className="text-[12px] font-bold text-[#34c759] uppercase tracking-widest leading-none">
                    ✓ Letter Mastered
                  </h3>
                  <h2 className="text-[20px] font-bold text-text-primary tracking-tight mt-1 leading-none">
                    {masteryBanner.letter} mastered
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-semibold text-text-secondary bg-surface-secondary/50 px-4 py-1.5 rounded-xl border border-border/5">
                  Next Focus: <span className="text-accent font-bold">{masteryBanner.nextLetter}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound("click")
                    closeMasteryBanner()
                  }}
                  className="text-text-muted hover:text-text-secondary font-bold text-[18px] cursor-pointer"
                >
                  ×
                </button>
              </div>
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
