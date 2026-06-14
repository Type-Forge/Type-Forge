"use client"

import { useEffect, useRef } from "react"
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

  // Initialize default session on mount
  useEffect(() => {
    initSession({ mode: "words", wordCount: 25 })
  }, [initSession])

  // Bind key capture events and fetch metrics
  const { wpm, accuracy } = useTypingEngine()

  // Track timed mode countdown
  useCountdown(
    config.duration ?? 60,
    () => {
      const finalCorrect = countCorrectChars(words)
      const durationSecs = config.duration ?? 60
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
    status === "running" && config.mode === "timed"
  )

  const handleRestart = () => {
    resetSession()
  }

  const handleNewSession = () => {
    resetSession()
    setTimeout(() => {
      selectorRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Get most recent log entry
  const latestResult = useStatsStore((s) => s.history[0])

  return (
    <Container className="flex flex-col flex-1 max-w-3xl">
      {/* Tagline header */}
      <div className="text-center my-4">
        <p className="text-xs font-heading font-semibold text-text-secondary uppercase tracking-widest">
          Decode. Type. Break the cipher.
        </p>
      </div>

      {/* Mode configurations selector */}
      {status !== "finished" && (
        <div ref={selectorRef} className="mb-2">
          <ModeSelector onSelect={initSession} currentConfig={config} />
        </div>
      )}

      {/* Play area */}
      {status !== "finished" && <TypingArea />}

      {/* Live ticking stats bar */}
      {status === "running" && (
        <StatsBar
          wpm={wpm}
          accuracy={accuracy}
          time={timeRemaining}
          mode={config.mode}
        />
      )}

      {/* Post-session results display */}
      {status === "finished" && latestResult && (
        <ResultsCard
          result={latestResult}
          onRestart={handleRestart}
          onNewSession={handleNewSession}
        />
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
