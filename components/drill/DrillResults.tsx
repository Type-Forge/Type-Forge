"use client"

import { motion } from "motion/react"
import type { SessionResult } from "@/types"
import { useDrillStore } from "@/stores/drill-store"
import { useStatsStore } from "@/stores/stats-store"
import { calculateKeyWeakness } from "@/engine/drill-engine"

interface DrillResultsProps {
  result: SessionResult
  onRestart: () => void
  onNewSession: () => void
}

export default function DrillResults({ result, onRestart, onNewSession }: DrillResultsProps) {
  const { keyStats } = useDrillStore()
  const statsStore = useStatsStore()

  const focusKeys = result.config.targetKeys ?? []
  const focusBigrams = result.config.targetBigrams ?? []
  const targetWpm = result.config.targetWpm

  // Check if they met target WPM (if specified)
  const isTargetMet = targetWpm ? result.wpm >= targetWpm : null

  // Calculate current accuracy of focus keys
  const focusKeysStats = focusKeys.map((key) => {
    const stats = keyStats[key.toLowerCase()]
    const accuracy = stats && stats.totalAttempts > 0 
      ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
      : 100
    const weakness = stats ? calculateKeyWeakness(stats) : 0
    return { key, accuracy, weakness }
  })

  // Session duration text
  const durationSecs = result.duration

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      {/* Semi-transparent Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto"
        onClick={onNewSession}
      />

      {/* iOS Slide-up Drawer Container */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280, mass: 0.8 }}
        className="relative w-full max-w-xl mx-auto bg-surface/80 border border-border border-b-0 backdrop-blur-[40px] rounded-t-[38px] p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pointer-events-auto flex flex-col select-none"
      >
        {/* iOS Drag Handle */}
        <div className="w-10 h-[5px] rounded-full bg-text-tertiary/30 mx-auto mb-6 mt-1 cursor-grab active:cursor-grabbing" />

        {/* Circular Close Button */}
        <button
          onClick={onNewSession}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-surface-hover/80 hover:bg-surface-hover text-text-muted hover:text-text-primary flex items-center justify-center transition-colors active:scale-95 cursor-pointer focus:outline-none"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Title */}
        <div className="text-center mt-2 mb-2">
          <span className="text-[11px] font-bold tracking-wide text-accent font-mono uppercase block mb-1">
            Drill Training Report
          </span>
        </div>

        {/* Hero WPM Speed */}
        <div className="text-center my-4">
          <div className="relative inline-block">
            <span className="text-7xl font-heading font-extrabold text-text-primary leading-none tracking-tight">
              {result.wpm}
            </span>
            {targetWpm && (
              <span className="absolute -top-3 -right-16 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary border border-border/30 text-text-secondary">
                Target: {targetWpm}
              </span>
            )}
          </div>
          <span className="block text-xs text-text-secondary font-sans font-medium mt-3">
            Words per minute
          </span>
        </div>

        {/* Bento Grid layout for secondary stats */}
        <div className="grid grid-cols-3 gap-3 w-full my-4">
          {/* Accuracy card */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-hover/50 border border-border/40">
            <span className="text-2xl font-mono tabular-nums text-text-primary font-bold">
              {result.accuracy}%
            </span>
            <span className="text-[11px] font-medium text-text-secondary mt-1.5">
              Accuracy
            </span>
          </div>

          {/* Time duration card */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-hover/50 border border-border/40">
            <span className="text-2xl font-mono tabular-nums text-text-primary font-bold">
              {durationSecs.toFixed(1)}s
            </span>
            <span className="text-[11px] font-medium text-text-secondary mt-1.5">
              Time taken
            </span>
          </div>

          {/* Target Status Card */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-hover/50 border border-border/40">
            <span className={`text-sm font-extrabold uppercase tracking-wider ${
              isTargetMet === null ? "text-text-secondary" : isTargetMet ? "text-success" : "text-danger"
            }`}>
              {isTargetMet === null ? "Practice" : isTargetMet ? "Met!" : "Failed"}
            </span>
            <span className="text-[11px] font-medium text-text-secondary mt-1.5">
              WPM Target
            </span>
          </div>
        </div>

        {/* trained focus targets details */}
        {(focusKeys.length > 0 || focusBigrams.length > 0) && (
          <div className="bg-surface-secondary/45 border border-border/20 rounded-2xl p-4 my-2 text-left space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary block font-mono">
              Target Key Stats Post-Drill
            </span>
            <div className="flex flex-wrap gap-2">
              {focusKeysStats.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border/30 text-xs font-semibold"
                >
                  <span className="font-extrabold text-accent">{item.key.toUpperCase()}</span>
                  <span className="text-[10px] text-text-secondary font-mono">{item.accuracy}% Acc</span>
                </div>
              ))}
              {focusBigrams.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border/30 text-xs font-semibold"
                >
                  <span className="font-extrabold text-accent">{b.toUpperCase()}</span>
                  <span className="text-[10px] text-text-tertiary">transition</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decryption status review subtext */}
        <div className="w-full text-center text-xs text-text-secondary leading-relaxed px-4 my-4">
          {isTargetMet === true
            ? "Drill completed successfully. WPM target surpassed, muscle memory aligned."
            : isTargetMet === false
            ? "Drill finished. Hand transition speed fell short of target WPM. Keep practicing."
            : result.accuracy >= 95 
            ? "Precision targets achieved. High accuracy transition logged."
            : "Drill completed. Accuracy is below peak synchronization threshold. Focus on control."}
        </div>

        {/* iOS-like CTAs layout */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <button
            onClick={onRestart}
            className="flex-1 h-13 rounded-2xl bg-accent hover:opacity-90 text-white text-sm font-semibold
                       transition-transform duration-150 active:scale-[0.98] cursor-pointer focus:outline-none shadow-sm font-sans"
          >
            Try again
          </button>
          <button
            onClick={onNewSession}
            className="flex-1 h-13 rounded-2xl border border-border bg-surface-hover/80 text-text-primary text-sm font-semibold
                       hover:bg-surface-hover hover:text-text-primary transition-[transform,colors] duration-150 active:scale-[0.98] cursor-pointer focus:outline-none font-sans"
          >
            Back to trainer
          </button>
        </div>
      </motion.div>
    </div>
  )
}
