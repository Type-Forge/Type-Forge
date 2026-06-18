"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useBattleStore } from "@/stores/battle-store"
import { useTypingStore } from "@/stores/typing-store"
import { calculateAiProgressPerTick } from "@/engine/battle-engine"
import DifficultySelector from "./DifficultySelector"
import BattleTrack from "./BattleTrack"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import Link from "next/link"
import type { BattleDifficulty } from "@/types"
import { BATTLE_COUNTDOWN_SECONDS } from "@/lib/constants"
import { useStatsStore } from "@/stores/stats-store"
import { countCorrectChars } from "@/engine/typing-engine"
import { calculateWpm, calculateAccuracy, generateId } from "@/lib/utils"

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
    initSession,
    startSession,
  } = useTypingStore()

  const { wpm, accuracy } = useTypingEngine()

  // Countdown timer clock
  useEffect(() => {
    if (battleStatus !== "countdown") return

    initSession({ mode: "battle", wordCount: battleConfig.wordCount, difficulty: battleConfig.difficulty })

    const interval = setInterval(() => {
      const currentCountdown = useBattleStore.getState().countdown
      if (currentCountdown > 1) {
        setCountdown(currentCountdown - 1)
      } else {
        clearInterval(interval)
        setCountdown(0)
        setBattleStatus("racing")
        // Note: startSession is now called when the user types their first correct key in useTypingEngine
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [battleStatus, setCountdown, setBattleStatus, initSession, battleConfig.wordCount, battleConfig.difficulty])

  // Opponent AI progress calculation loops (100ms ticks)
  useEffect(() => {
    if (battleStatus !== "racing") return

    const tickMs = 100
    const interval = setInterval(() => {
      const typingStatus = useTypingStore.getState().status
      if (typingStatus !== "running") {
        return // AI waits until the player starts typing!
      }

      const state = useBattleStore.getState()
      const currentAi = state.aiProgress
      const currentPlayer = state.playerProgress
      const config = state.config

      if (currentAi >= 1.0) {
        clearInterval(interval)
        if (!state.winner) {
          setWinner("ai")
          const typingStore = useTypingStore.getState()

          // Log the battle session result where the player lost
          const finalWords = typingStore.words
          const finalCorrect = countCorrectChars(finalWords)
          const finalElapsed = Date.now() - (typingStore.startTime || Date.now())
          const wpmVal = calculateWpm(finalCorrect, finalElapsed)
          const accVal = calculateAccuracy(
            typingStore.correctKeystrokes,
            typingStore.totalKeystrokes
          )

          useStatsStore.getState().addResult({
            id: generateId(),
            timestamp: Date.now(),
            config: typingStore.config,
            wpm: wpmVal,
            accuracy: accVal,
            totalKeystrokes: typingStore.totalKeystrokes,
            correctKeystrokes: typingStore.correctKeystrokes,
            incorrectKeystrokes: typingStore.incorrectKeystrokes,
            duration: finalElapsed / 1000,
            wordsCompleted: typingStore.currentWordIndex,
          })

          typingStore.setStatus("finished")
        }
        return
      }

      if (currentPlayer >= 1.0) {
        clearInterval(interval)
        return
      }

      const increment = calculateAiProgressPerTick(
        config.difficulty,
        config.wordCount,
        tickMs
      )
      setAiProgress(Math.min(currentAi + increment, 1.0))
    }, tickMs)

    return () => clearInterval(interval)
  }, [battleStatus, setAiProgress, setWinner])

  const handleSelectDifficulty = (diff: BattleDifficulty) => {
    initBattle(diff, 25)
  }

  const handleRestart = () => {
    resetBattle()
    initSession({ mode: "words", wordCount: 25 })
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 relative select-none">
      {/* 1. Selection State */}
      {battleStatus === "selecting" && (
        <DifficultySelector onSelect={handleSelectDifficulty} />
      )}

      {/* 2. Countdown State */}
      {battleStatus === "countdown" && (
        <div className="text-center py-16 flex flex-col items-center justify-center min-h-[220px]">
          <span className="text-xs font-semibold text-text-tertiary mb-6 animate-pulse">
            Rotor sync in progress
          </span>
          <div className="w-24 h-24 rounded-full flex items-center justify-center relative bg-surface-secondary/40 shadow-sm">
            {/* Apple circular background progress indicator */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-border opacity-20 fill-none"
                strokeWidth="4"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-accent fill-none"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 283 }}
                transition={{ duration: BATTLE_COUNTDOWN_SECONDS, ease: "linear" }}
                style={{ 
                  strokeDasharray: "283"
                }}
              />
            </svg>
            
            <AnimatePresence mode="popLayout">
              <motion.span
                key={countdown}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="text-4xl font-sans font-medium text-text-primary absolute"
              >
                {countdown}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 3. Racing State */}
      {(battleStatus === "racing" || battleStatus === "finished") && (
        <div className="w-full">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
            <span className="text-xs font-semibold text-text-secondary">
              {battleConfig.difficulty.charAt(0).toUpperCase() + battleConfig.difficulty.slice(1)}
            </span>
            <button
              onClick={handleRestart}
              className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              Restart race
            </button>
          </div>

          {/* Tracks grid */}
          <div className="flex flex-col gap-4">
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
        </div>
      )}
    </div>
  )
}
