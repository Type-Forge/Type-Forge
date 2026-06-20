"use client"

import { useState } from "react"
import { motion } from "motion/react"
import type { SessionResult } from "@/types"
import { playClickSound } from "@/lib/audio"
import { useSettingsStore } from "@/stores/settings-store"
import AnalysisDrawer from "./AnalysisDrawer"

interface ResultsCardProps {
  result: SessionResult
  onRestart: () => void
  onNewSession: () => void
}

function getPerformanceGrade(wpm: number, accuracy: number): { grade: string; label: string; color: string } {
  const score = wpm * (accuracy / 100)
  
  if (accuracy < 75) {
    return { grade: "F", label: "Needs Work", color: "text-incorrect" }
  }
  if (score >= 80 && accuracy >= 95) {
    return { grade: "S", label: "Elite", color: "text-correct font-bold" }
  }
  if (score >= 65 && accuracy >= 93) {
    return { grade: "A+", label: "Excellent", color: "text-accent font-bold" }
  }
  if (score >= 55 && accuracy >= 90) {
    return { grade: "A", label: "Great", color: "text-accent" }
  }
  if (score >= 45 && accuracy >= 85) {
    return { grade: "B+", label: "Strong", color: "text-text-primary" }
  }
  if (score >= 35 && accuracy >= 80) {
    return { grade: "B", label: "Good", color: "text-text-primary" }
  }
  if (score >= 25 && accuracy >= 75) {
    return { grade: "C+", label: "Average", color: "text-text-secondary" }
  }
  if (score >= 15 && accuracy >= 70) {
    return { grade: "C", label: "Fair", color: "text-text-secondary" }
  }
  return { grade: "D", label: "Needs Work", color: "text-incorrect" }
}

function getAccuracyStyle(accuracy: number): { color: string; label?: string } {
  if (accuracy >= 95) return { color: "text-correct", label: "Excellent" }
  if (accuracy >= 90) return { color: "text-accent", label: "Great" }
  if (accuracy >= 85) return { color: "text-text-primary", label: "Good" }
  return { color: "text-incorrect", label: "Needs Work" }
}

export default function ResultsCard({ result, onRestart, onNewSession }: ResultsCardProps) {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const correct = result.correctKeystrokes
  const total = result.totalKeystrokes

  const gradeInfo = getPerformanceGrade(result.wpm, result.accuracy)
  const accStyle = getAccuracyStyle(result.accuracy)

  const reducedMotion = useSettingsStore((s) => s.reducedMotion)

  const initialProps = reducedMotion ? { y: 0, opacity: 0 } : { y: "100%" }
  const animateProps = { y: 0, opacity: 1 }
  const exitProps = reducedMotion ? { opacity: 0 } : { y: "100%" }
  const transitionProps = reducedMotion
    ? { duration: 0.15, ease: "easeOut" as const }
    : { type: "spring" as const, damping: 30, stiffness: 280, mass: 0.8 }

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
        {/* iOS Drag Handle Indicator */}
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
          <span className="text-[11px] font-semibold tracking-wide text-accent font-sans block mb-1">
            Session report
          </span>
        </div>

        {/* Hero stats layout - WPM & Performance Grade side-by-side */}
        <div className="grid grid-cols-2 divide-x divide-border/10 my-6 font-sans">
          {/* Left Column: WPM */}
          <div className="text-center">
            <span className="text-[48px] font-sans font-bold text-text-primary leading-none tracking-tight">
              {result.wpm}
            </span>
            <span className="block text-[11px] text-text-secondary font-semibold uppercase tracking-wider mt-2.5">
              Speed (WPM)
            </span>
          </div>

          {/* Right Column: Grade */}
          <div className="text-center">
            <span className={`text-[48px] font-sans font-bold leading-none tracking-tight ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </span>
            <span className="block text-[11px] text-text-secondary font-semibold uppercase tracking-wider mt-2.5">
              Grade: {gradeInfo.label}
            </span>
          </div>
        </div>

        {/* Grouped List layout for secondary stats */}
        <div className="w-full my-6 bg-surface-secondary/50 rounded-2xl border border-border/10 divide-y divide-border/10 overflow-hidden font-sans">
          {/* Accuracy Row */}
          <div className="flex items-center justify-between px-4 py-3.5 text-[15px]">
            <span className="text-text-secondary font-medium">Accuracy</span>
            <div className="flex items-center gap-1.5 font-semibold tabular-nums">
              {accStyle.label && (
                <span className={`text-[10px] uppercase tracking-wider font-bold ${accStyle.color}`}>
                  {accStyle.label}
                </span>
              )}
              <span className={accStyle.color}>{result.accuracy}%</span>
            </div>
          </div>
          {/* Time Duration Row */}
          <div className="flex items-center justify-between px-4 py-3.5 text-[15px]">
            <span className="text-text-secondary font-medium">Time Taken</span>
            <span className="text-text-primary font-semibold tabular-nums">{result.duration.toFixed(1)}s</span>
          </div>
          {/* Characters Correctness Row */}
          <div className="flex items-center justify-between px-4 py-3.5 text-[15px]">
            <span className="text-text-secondary font-medium">Correct Keys</span>
            <span className="text-text-primary font-semibold tabular-nums">{correct} / {total}</span>
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
            <span>Detailed Analysis</span>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-accent">
              Charts & Heatmap
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>

        {/* Performance status review subtext */}
        <div className="w-full text-center text-xs text-text-secondary leading-relaxed px-4 mb-6">
          {result.accuracy >= 95 
            ? "Exceptional performance. High precision across the board." 
            : "Session completed. Review your detailed analysis for improvement areas."}
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
            New session
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
