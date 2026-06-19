"use client"

import React from "react"
import { motion } from "motion/react"
import { useYoloStore } from "@/stores/yolo-store"
import { useTypingStore } from "@/stores/typing-store"
import { playClickSound } from "@/lib/audio"
import WhiteCard from "@/components/ui/WhiteCard"

interface YoloResultsProps {
  onRestart: () => void
  onNewSession: () => void
}

export default function YoloResults({ onRestart, onNewSession }: YoloResultsProps) {
  const activeLetter = useYoloStore((s) => s.activeLetter)
  const letterProfiles = useYoloStore((s) => s.letterProfiles)
  const sessionSummary = useYoloStore((s) => s.sessionSummary)
  const finishYoloSession = useYoloStore((s) => s.finishYoloSession)

  const correctKeystrokes = useTypingStore((s) => s.correctKeystrokes)
  const totalKeystrokes = useTypingStore((s) => s.totalKeystrokes)
  const startTime = useTypingStore((s) => s.startTime)
  const endTime = useTypingStore((s) => s.endTime)

  // Calculate metrics
  const elapsedMs = startTime && endTime ? endTime - startTime : 0
  const durationSecs = elapsedMs / 1000
  
  // Calculate WPM: (correct characters) / 5 / minutes
  const correctChars = useTypingStore((s) => {
    let count = 0
    s.words.forEach(w => {
      w.letters.forEach(l => {
        if (l.state === "correct") count++
      })
    })
    return count
  })
  
  const wpm = elapsedMs > 0 ? Math.round((correctChars / 5) / (durationSecs / 60)) : 0
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100

  const activeProfile = activeLetter ? letterProfiles[activeLetter] : null
  const activeConfidence = activeProfile ? activeProfile.confidence : 0

  const handleContinue = () => {
    playClickSound("click")
    // Finish session to save stats to stats history
    finishYoloSession(wpm, accuracy, durationSecs)
    onRestart()
  }

  const handleExit = () => {
    playClickSound("click")
    finishYoloSession(wpm, accuracy, durationSecs)
    onNewSession()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-xl mx-auto space-y-6 select-none font-sans"
    >
      <div className="text-center">
        <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">
          Run Complete
        </span>
        <h2 className="text-[32px] font-bold text-text-primary leading-tight tracking-tight mt-0.5">
          YOLO Session
        </h2>
      </div>

      <WhiteCard className="p-6 divide-y divide-border/10">
        {/* Core Stats Row */}
        <div className="grid grid-cols-2 gap-6 pb-6 text-center sm:text-left sm:grid-cols-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">
              WPM
            </span>
            <p className="text-[32px] font-bold text-accent tracking-tight leading-none">
              {wpm}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">
              Accuracy
            </span>
            <p className="text-[32px] font-bold text-[#34c759] tracking-tight leading-none">
              {accuracy}%
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">
              Words
            </span>
            <p className="text-[32px] font-bold text-text-primary tracking-tight leading-none">
              {sessionSummary.wordsCompleted}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-text-secondary uppercase">
              Duration
            </span>
            <p className="text-[32px] font-bold text-text-primary tracking-tight leading-none">
              {durationSecs >= 60 ? `${Math.floor(durationSecs / 60)}m` : `${Math.round(durationSecs)}s`}
            </p>
          </div>
        </div>

        {/* Mastered / Progression Summary */}
        <div className="py-6 space-y-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Focus Progression
            </span>
            <p className="text-sm text-text-secondary leading-normal">
              Active Focus: <strong className="text-text-primary font-bold">{activeLetter?.toUpperCase() || "?"}</strong> &middot; currently at <strong className="text-accent font-bold">{activeConfidence}%</strong> confidence.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Letters Mastered This Run
            </span>
            {sessionSummary.lettersMasteredThisSession.length === 0 ? (
              <p className="text-xs italic text-text-secondary">
                No new letters mastered in this run. Keep training to unlock the next letters!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {sessionSummary.lettersMasteredThisSession.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-secondary text-xs font-bold text-[#34c759] border border-border/10"
                  >
                    {l.toUpperCase()} Mastered
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:flex-1 h-12 rounded-[14px] bg-gradient-to-r from-accent to-[#0a84ff] text-white text-[14px] font-bold tracking-tight shadow-[0_4px_12px_rgba(10,132,255,0.25)] hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(10,132,255,0.3)] transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            Continue YOLO
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="w-full sm:w-auto px-6 h-12 rounded-[14px] border border-border bg-surface text-text-secondary hover:text-text-primary text-[14px] font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer flex items-center justify-center"
          >
            Exit YOLO
          </button>
        </div>
      </WhiteCard>
    </motion.div>
  )
}
