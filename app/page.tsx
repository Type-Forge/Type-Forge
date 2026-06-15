"use client"

import { useEffect, useRef, useState } from "react"
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

      finishSession()

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
    <Container className="flex flex-col flex-1 max-w-3xl">
      {/* Tagline header */}
      <div className="text-center mb-8">
        <p className="text-center text-xs text-text-muted font-sans font-medium tracking-wide">
          Decode · Type · Break the cipher
        </p>
      </div>

      {/* Mode configurations selector */}
      <div
        ref={selectorRef}
        className={`mb-2 transition-opacity duration-300 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
      >
        <ModeSelector onSelect={initSession} currentConfig={config} />
      </div>

      {/* Play area */}
      <div
        className={`transition-opacity duration-300 ${status === "finished" ? "opacity-20 pointer-events-none" : "opacity-100"}`}
      >
        {config.mode === "battle" ? (
          <BattleView />
        ) : config.mode === "drill" && !isDrillActive ? (
          <DrillDashboard onStartDrill={() => setIsDrillActive(true)} />
        ) : (
          <TypingArea />
        )}
      </div>

      {/* Live ticking stats bar */}
      {status === "running" && config.mode !== "battle" && (
        <StatsBar
          wpm={wpm}
          accuracy={accuracy}
          time={timeRemaining}
          mode={config.mode}
        />
      )}

      {/* Post-session results display */}
      {status === "finished" && config.mode !== "battle" && latestResult && (
        config.mode === "drill" ? (
          <DrillResults
            result={latestResult}
            onRestart={handleRestart}
            onNewSession={handleNewSession}
          />
        ) : (
          <ResultsCard
            result={latestResult}
            onRestart={handleRestart}
            onNewSession={handleNewSession}
          />
        )
      )}

      {/* Persistent historical records logs */}
      {(status === "idle" || status === "ready") && (
        <div className="mt-8 border-t border-border/40 pt-8">
          <StatsHistory />
        </div>
      )}
    </Container>
  )
}
