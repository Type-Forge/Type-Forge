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
 * BattleView handles the matching state loops.
 * Redesigned to use lowercase simple headers and floating stats.
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

  // Countdown timer clock
  useEffect(() => {
    if (battleStatus !== "countdown") return

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

  // Opponent AI progress calculation loops (100ms ticks)
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
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-2 relative select-none">
      {/* 1. Selection State */}
      {battleStatus === "selecting" && (
        <DifficultySelector onSelect={handleSelectDifficulty} />
      )}

      {/* 2. Countdown State */}
      {battleStatus === "countdown" && (
        <div className="text-center py-16">
          <span className="block text-[10px] uppercase tracking-widest text-text-muted font-heading font-bold mb-4 animate-pulse">
            rotor sync in progress
          </span>
          <span className="text-8xl font-heading font-extrabold text-text-primary leading-none">
            {countdown}
          </span>
        </div>
      )}

      {/* 3. Racing State */}
      {(battleStatus === "racing" || battleStatus === "finished") && (
        <div className="w-full max-w-xl">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-8 pb-3 border-b border-border">
            <span className="text-[10px] uppercase font-heading font-bold tracking-widest text-text-secondary">
              {battleConfig.difficulty.toLowerCase()}
            </span>
            <button
              onClick={handleRestart}
              className="text-[9px] font-heading font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              restart race
            </button>
          </div>

          {/* Tracks grid */}
          <div className="flex flex-col gap-4 mb-8">
            <BattleTrack
              label="you"
              progress={playerProgress}
              wpm={wpm}
              isPlayer={true}
            />
            <BattleTrack
              label="enigma machine"
              progress={aiProgress}
              wpm={battleConfig.aiWpm}
              isPlayer={false}
            />
          </div>

          {/* Live Race Typing Canvas */}
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

          {/* 4. Post-race Results */}
          {battleStatus === "finished" && (
            <div className="text-center py-10 border-t border-border mt-8">
              <span className="block text-[10px] uppercase tracking-widest text-text-muted font-heading font-bold mb-2">
                decryption complete
              </span>
              <h3
                className={`text-3xl font-heading font-bold mb-3 ${
                  winner === "player" ? "text-correct" : "text-incorrect"
                }`}
              >
                {winner === "player" ? "sync successful" : "rotor lockout"}
              </h3>
              <p className="text-xs text-text-secondary mb-8 leading-relaxed max-w-sm mx-auto">
                {winner === "player"
                  ? `decrypted the code grid before the enigma rotors fully synced at ${battleConfig.aiWpm} wpm.`
                  : `enigma machine resolved encryption values first. rotor synchronization locked you out.`}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-6 py-2 rounded-lg bg-text-primary text-bg hover:opacity-90 font-heading font-semibold text-xs transition-transform active:scale-[0.97] duration-150 cursor-pointer shadow-sm"
                >
                  race again
                </button>
                <Link
                  href="/"
                  onClick={() => {
                    resetBattle()
                    initSession({ mode: "words", wordCount: 25 })
                  }}
                  className="px-6 py-2 rounded-lg border border-border bg-transparent text-text-secondary hover:text-text-primary font-heading font-semibold text-xs transition-[transform,colors] active:scale-[0.97] duration-150 cursor-pointer"
                >
                  return home
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
