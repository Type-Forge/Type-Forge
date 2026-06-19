"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useYoloStore, YOLO_SEQUENCE } from "@/stores/yolo-store"
import { useTypingStore } from "@/stores/typing-store"
import { playClickSound } from "@/lib/audio"
import WhiteCard from "@/components/ui/WhiteCard"
import AlertModal from "@/components/ui/AlertModal"

interface YoloDashboardProps {
  onExit: () => void
}

export default function YoloDashboard({ onExit }: YoloDashboardProps) {
  const activeLetter = useYoloStore((s) => s.activeLetter)
  const letterProfiles = useYoloStore((s) => s.letterProfiles)
  const totalWordsCompleted = useYoloStore((s) => s.totalWordsCompleted)
  const streak = useYoloStore((s) => s.streak)
  const sessionSummary = useYoloStore((s) => s.sessionSummary)
  const startFresh = useYoloStore((s) => s.startFresh)
  const initSession = useTypingStore((s) => s.initSession)
  const resetSession = useTypingStore((s) => s.resetSession)

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const profile = activeLetter ? letterProfiles[activeLetter] : null
  const confidence = profile ? profile.confidence : 0
  const attempts = profile ? profile.attempts : 0

  // Derive mastered letters list dynamically
  const masteredLetters = YOLO_SEQUENCE.filter(
    (l) => letterProfiles[l] && letterProfiles[l].confidence >= 90
  )

  // Find next letter to unlock in sequence
  const nextUnlockIndex = activeLetter ? YOLO_SEQUENCE.indexOf(activeLetter) + 1 : -1
  const nextLetter = nextUnlockIndex > 0 && nextUnlockIndex < YOLO_SEQUENCE.length
    ? YOLO_SEQUENCE[nextUnlockIndex]
    : null

  // SVG Circular progress computations
  const radius = 50
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (confidence / 100) * circumference

  const handleStartFresh = () => {
    playClickSound("click")
    startFresh()
    initSession({ mode: "yolo" })
    setIsResetModalOpen(false)
  }

  return (
    <div className="w-full py-2 animate-fade-in font-sans select-none space-y-6">
      {/* 1. Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">
            Endless Training
          </span>
          <h2 className="text-[32px] font-bold text-text-primary leading-tight tracking-tight mt-0.5">
            YOLO Mode
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound("click")
              setIsResetModalOpen(true)
            }}
            className="h-9 px-4 rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            Start Fresh
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound("click")
              onExit()
            }}
            className="h-9 px-4 rounded-xl bg-[#ff3b30] hover:bg-[#e03126] text-white text-[12px] font-bold transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-sm"
          >
            Quit YOLO
          </button>
        </div>
      </div>

      {/* 2. Main Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card A: Circular Focus Ring */}
        <WhiteCard className="md:col-span-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Current Focus
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center select-none">
            {/* SVG Ring */}
            <svg className="absolute w-full h-full transform -rotate-90">
              {/* Background circle track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-border/10 fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Foreground progress path */}
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-accent fill-none"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>

            {/* Centered Focus Keycap */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-sans text-text-primary">
                {activeLetter?.toUpperCase() || "?"}
              </span>
              <span className="text-xs text-text-secondary font-semibold mt-1">
                {confidence}% Confidence
              </span>
            </div>
          </div>

          <div className="text-center text-[12px] text-text-secondary leading-normal max-w-[200px]">
            {attempts < 30 ? (
              <span>Type at least <strong className="text-text-primary font-bold">{30 - attempts}</strong> more keys to evaluate mastery.</span>
            ) : (
              <span>Reach <strong className="text-text-primary font-bold">90%</strong> confidence to unlock the next letter.</span>
            )}
          </div>
        </WhiteCard>

        {/* Card B: Session Stats Grid */}
        <WhiteCard className="md:col-span-2 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Performance Indicators
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-text-secondary uppercase">
                  Streak
                </span>
                <p className="text-[28px] font-bold text-accent tracking-tight">
                  {streak} <span className="text-[12px] text-text-secondary font-semibold font-sans">words</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-text-secondary uppercase">
                  Session Words
                </span>
                <p className="text-[28px] font-bold text-text-primary tracking-tight">
                  {sessionSummary.wordsCompleted}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-text-secondary uppercase">
                  Total Completed
                </span>
                <p className="text-[28px] font-bold text-text-primary tracking-tight">
                  {totalWordsCompleted}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/10 pt-4 flex items-center justify-between text-xs text-text-secondary">
            <div>
              Next unlock: <strong className="text-text-primary font-bold">{nextLetter?.toUpperCase() || "None"}</strong>
            </div>
            <div className="text-[11px] italic">
              YOLO mode adapts live to your speeds.
            </div>
          </div>
        </WhiteCard>
      </div>

      {/* 3. Mastered Letters List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Mastered Keys ({masteredLetters.length} / 26)
        </h3>

        {masteredLetters.length === 0 ? (
          <div className="text-sm italic text-text-secondary py-4 px-2">
            No keys mastered yet. Keep training to unlock your first key!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {masteredLetters.map((l) => (
              <div
                key={l}
                className="px-3.5 py-1.5 rounded-xl bg-surface border border-border/10 flex items-center gap-2 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <span className="text-sm font-bold text-text-primary">
                  {l.toUpperCase()}
                </span>
                <span className="text-[10px] font-bold text-[#34c759] bg-[#34c759]/10 px-1.5 py-0.5 rounded-full">
                  ✓ {letterProfiles[l]?.confidence || 90}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Modal Alert */}
      <AlertModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleStartFresh}
        title="Reset YOLO Progress?"
        message="This will completely clear your YOLO letter profiles, mastered keys count, and reset you back to your weakest key (or 'E'). This cannot be undone."
        confirmText="Reset Progress"
        type="destructive"
      />
    </div>
  )
}
