"use client"

import { useState } from "react"
import { motion } from "motion/react"
import type { SessionResult } from "@/types"
import { useSettingsStore } from "@/stores/settings-store"
import { playClickSound } from "@/lib/audio"
import AnalysisDrawer from "../stats/AnalysisDrawer"

interface DrillResultsProps {
  result: SessionResult
  onRestart: () => void
  onNewSession: () => void
}

export default function DrillResults({ result, onRestart, onNewSession }: DrillResultsProps) {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const focusKeys = result.config.targetKeys ?? []
  const focusBigrams = result.config.targetBigrams ?? []
  const targetWpm = result.config.targetWpm

  // Check if they met target WPM (if specified)
  const isTargetMet = targetWpm ? result.wpm >= targetWpm : null
  const durationSecs = result.duration

  const reducedMotion = useSettingsStore((s) => s.reducedMotion)

  const initialProps = reducedMotion ? { y: 0, opacity: 0 } : { y: "100%" }
  const animateProps = { y: 0, opacity: 1 }
  const exitProps = reducedMotion ? { opacity: 0 } : { y: "100%" }
  const transitionProps = reducedMotion
    ? { duration: 0.15, ease: "easeOut" as const }
    : { type: "spring" as const, damping: 30, stiffness: 280, mass: 0.8 }

  // Target Status Details
  let targetBadgeText = ""
  let targetSubText = ""
  if (targetWpm) {
    const wpmDiff = result.wpm - targetWpm
    if (isTargetMet) {
      targetBadgeText = "✓ MET"
      targetSubText = wpmDiff > 0 ? `Target Surpassed by ${wpmDiff} WPM` : "Target Met exactly"
    } else {
      targetBadgeText = "✗ FAILED"
      targetSubText = `${Math.abs(wpmDiff)} WPM Short`
    }
  }

  // Dynamic feedback subtext
  const targetLabel = focusKeys.length > 0 
    ? `on keys: ${focusKeys.map(k => k.toUpperCase()).join(", ")}` 
    : focusBigrams.length > 0 
    ? `on bigrams: ${focusBigrams.map(b => b.toUpperCase()).join(", ")}` 
    : ""

  const reviewText = isTargetMet === true && targetWpm
    ? `Great progress ${targetLabel}. Target speed exceeded by ${result.wpm - targetWpm} WPM.`
    : isTargetMet === false && targetWpm
    ? `Keep practicing ${targetLabel}. You were ${targetWpm - result.wpm} WPM short of target.`
    : result.accuracy >= 95
    ? `Precision targets achieved ${targetLabel}. High accuracy transition logged.`
    : `Drill completed ${targetLabel}. Focus on accuracy and control.`

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      {/* Semi-transparent Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto"
        onClick={() => {
          playClickSound("click")
          onNewSession()
        }}
      />

      {/* iOS Slide-up Drawer Container */}
      <motion.div
        initial={initialProps}
        animate={animateProps}
        exit={exitProps}
        transition={transitionProps}
        className="relative w-full max-w-xl mx-auto bg-surface/80 border border-border border-b-0 backdrop-blur-[40px] rounded-t-[38px] p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pointer-events-auto flex flex-col select-none"
      >
        {/* iOS Drag Handle */}
        <div className="w-10 h-[5px] rounded-full bg-text-tertiary/30 mx-auto mb-6 mt-1 cursor-grab active:cursor-grabbing" />

        {/* Circular Close Button (tactile, high contrast) */}
        <button
          onClick={() => {
            playClickSound("click")
            onNewSession()
          }}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-black/15 dark:border-white/15 text-text-primary flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Title */}
        <div className="text-center mt-2 mb-2">
          <span className="text-[11px] font-semibold tracking-wide text-accent font-sans block mb-1 uppercase">
            Drill Training Report
          </span>
        </div>

        {/* Hero WPM Speed */}
        <div className="text-center my-6">
          <span className="text-[48px] font-sans font-bold text-text-primary leading-none tracking-tight">
            {result.wpm}
          </span>
          <span className="block text-[11px] text-text-secondary font-semibold uppercase tracking-wider mt-2.5">
            Words per minute
          </span>
          {targetWpm ? (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold font-sans border ${
                isTargetMet 
                  ? "bg-correct/10 border-correct/20 text-correct" 
                  : "bg-incorrect/10 border-incorrect/20 text-incorrect"
              }`}>
                {targetBadgeText}
              </span>
              <span className="text-[12px] font-medium text-text-secondary font-sans">
                {targetSubText} (Target: {targetWpm} WPM)
              </span>
            </div>
          ) : (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold font-sans border bg-surface-secondary/50 border-border/10 text-text-secondary">
                Practice Mode
              </span>
            </div>
          )}
        </div>

        {/* Grouped List layout for secondary stats */}
        <div className="w-full my-6 bg-surface-secondary/50 rounded-2xl border border-border/10 divide-y divide-border/10 overflow-hidden font-sans">
          {/* Accuracy Row */}
          <div className="flex items-center justify-between px-4 py-3.5 text-[15px]">
            <span className="text-text-secondary font-medium">Accuracy</span>
            <span className="text-text-primary font-semibold tabular-nums">{result.accuracy}%</span>
          </div>
          {/* Time Duration Row */}
          <div className="flex items-center justify-between px-4 py-3.5 text-[15px]">
            <span className="text-text-secondary font-medium">Time Taken</span>
            <span className="text-text-primary font-semibold tabular-nums">{durationSecs.toFixed(1)}s</span>
          </div>
          {/* Detailed Analysis Row */}
          <button
            type="button"
            onClick={() => {
              playClickSound("click")
              setIsAnalysisOpen(true)
            }}
            className="w-full flex items-center justify-between px-4 py-3.5 text-[15px] hover:bg-surface-hover/50 text-accent font-semibold text-left transition-colors cursor-pointer active:scale-[0.99] focus:outline-none border-none"
          >
            <div className="flex flex-col">
              <span className="text-accent font-semibold">View Detailed Analysis</span>
              <span className="text-[11px] text-text-secondary font-normal mt-0.5">Charts • Heatmap • Timeline</span>
            </div>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-accent">
              Open
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>

        {/* Dynamic feedback subtext */}
        <div className="w-full text-center text-xs text-text-secondary leading-relaxed px-4 mb-6">
          {reviewText}
        </div>

        {/* iOS-like CTAs layout */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <button
            onClick={() => {
              playClickSound("click")
              onRestart()
            }}
            className="flex-1 h-13 rounded-2xl bg-accent hover:opacity-90 text-white text-sm font-semibold
                       transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm font-sans"
          >
            Try again
          </button>
          <button
            onClick={() => {
              playClickSound("click")
              onNewSession()
            }}
            className="flex-1 h-13 rounded-2xl border border-border bg-surface-hover/80 text-text-primary text-sm font-semibold
                       hover:bg-surface-hover hover:text-text-primary transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none font-sans"
          >
            Back to trainer
          </button>
        </div>
      </motion.div>

      {/* Analysis Drawer */}
      <AnalysisDrawer
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        result={result}
      />
    </div>
  )
}
