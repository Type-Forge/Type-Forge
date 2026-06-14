"use client"

import { useEffect } from "react"
import { useBattleStore } from "@/stores/battle-store"
import { useTypingStore } from "@/stores/typing-store"
import { calculateAiProgressPerTick } from "@/engine/battle-engine"
import DifficultySelector from "./DifficultySelector"
import BattleTrack from "./BattleTrack"
import TypingArea from "@/components/typing/TypingArea"
import StatsBar from "@/components/stats/StatsBar"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import Link from "next/link"

/**
 * BattleView orchestrates the full racing flow.
 * Toggles difficulty configurations, triggers active racing countdowns,
 * drives the 100ms simulated opponent intervals, and reveals winner messages.
 */
export default function BattleView() {
  const {
    status: battleStatus,
    config: battleConfig,
    playerProgress,
    aiProgress,
    countdown,
    winner,
    initBattle,
    setCountdown,
    setStatus: setBattleStatus,
    setAiProgress,
    setWinner,
    resetBattle,
  } = useBattleStore()

  const {
    status: typingStatus,
    initSession,
    startSession,
  } = useTypingStore()

  const { wpm, accuracy } = useTypingEngine()

  // Countdown timer logic
  useEffect(() => {
    if (battleStatus !== "countdown") return

    // Pre-initialize standard word count mode typing array
    initSession({ mode: "words", wordCount: battleConfig.wordCount })

    const interval = setInterval(() => {
      const currentCountdown = useBattleStore.getState().countdown
      if (currentCountdown > 1) {
        setCountdown(currentCountdown - 1)
      } else {
        clearInterval(interval)
        setCountdown(0)
        setBattleStatus("racing")
        startSession()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [battleStatus, setCountdown, setBattleStatus, initSession, startSession, battleConfig.wordCount])

  // AI simulated typing progress interval (updates every 100ms)
  useEffect(() => {
    if (battleStatus !== "racing") return

    const tickMs = 100
    const interval = setInterval(() => {
      const currentAi = useBattleStore.getState().aiProgress
      const currentPlayer = useBattleStore.getState().playerProgress

      if (currentAi >= 1.0) {
        clearInterval(interval)
        if (!useBattleStore.getState().winner) {
          setWinner("ai")
          useTypingStore.getState().setStatus("finished")
        }
        return
      }

      if (currentPlayer >= 1.0) {
        clearInterval(interval)
        return
      }

      const increment = calculateAiProgressPerTick(
        battleConfig.difficulty,
        battleConfig.wordCount,
        tickMs
      )
      setAiProgress(Math.min(currentAi + increment, 1.0))
    }, tickMs)

    return () => clearInterval(interval)
  }, [battleStatus, battleConfig, setAiProgress, setWinner])

  const handleSelectDifficulty = (diff: any) => {
    initBattle(diff, 25)
  }

  const handleRestart = () => {
    resetBattle()
    initSession({ mode: "words", wordCount: 25 })
  }

  return (
    <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-6 bg-surface/10 border border-border rounded-2xl relative">
      {/* 1. Selector view */}
      {battleStatus === "selecting" && (
        <DifficultySelector onSelect={handleSelectDifficulty} />
      )}

      {/* 2. Countdown view */}
      {battleStatus === "countdown" && (
        <div className="text-center py-12">
          <span className="block text-sm uppercase tracking-widest text-text-muted font-heading font-bold mb-4 animate-pulse">
            Establishing Secure Bletchley Connection
          </span>
          <span className="text-7xl font-heading font-extrabold text-accent">
            {countdown}
          </span>
        </div>
      )}

      {/* 3. Racing tracks & active interface */}
      {(battleStatus === "racing" || battleStatus === "finished") && (
        <div className="w-full max-w-2xl">
          {/* Header information */}
          <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-heading font-bold tracking-widest bg-accent-soft text-accent px-2.5 py-1 rounded-md">
                Enigma Race: {battleConfig.difficulty}
              </span>
            </div>
            <button
              onClick={handleRestart}
              className="text-xs font-heading font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Reset Match
            </button>
          </div>

          {/* Tracks layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 bg-surface/50 border border-border/50 p-6 rounded-xl">
            <BattleTrack
              label="You"
              progress={playerProgress}
              wpm={wpm}
              isPlayer={true}
            />
            <BattleTrack
              label="Enigma Machine"
              progress={aiProgress}
              wpm={battleConfig.aiWpm}
              isPlayer={false}
            />
          </div>

          {/* Typing field */}
          {battleStatus === "racing" && (
            <>
              <TypingArea />
              <StatsBar
                wpm={wpm}
                accuracy={accuracy}
                time={null}
                mode="words"
              />
            </>
          )}

          {/* 4. Results Overlay */}
          {battleStatus === "finished" && (
            <div className="text-center py-8 bg-surface border border-border rounded-xl p-8 shadow-lg">
              <span className="block text-xs uppercase tracking-widest text-text-muted font-heading font-semibold mb-2">
                Transmission Resolved
              </span>
              <h3
                className={`text-4xl font-heading font-bold mb-4 ${
                  winner === "player" ? "text-correct" : "text-incorrect"
                }`}
              >
                {winner === "player" ? "You Outsmarted Enigma!" : "Enigma Machine Intercepted!"}
              </h3>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                {winner === "player"
                  ? `Congratulations! You decrypted the code grid before the Enigma rotors synced at ${battleConfig.aiWpm} WPM.`
                  : `Enigma machine completed the encryption calculation first. Keep practicing your decryption speed, codebreaker.`}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-6 py-2.5 rounded-lg bg-accent text-bg hover:opacity-90 font-heading font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Race Again
                </button>
                <Link
                  href="/"
                  onClick={() => {
                    resetBattle()
                    initSession({ mode: "words", wordCount: 25 })
                  }}
                  className="px-6 py-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover font-heading font-bold text-sm transition-all cursor-pointer"
                >
                  Return Home
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
