"use client"

import { motion } from "motion/react"
import type { SessionResult } from "@/types"
import { playClickSound } from "@/lib/audio"

interface ResultsCardProps {
  result: SessionResult
  onRestart: () => void
  onNewSession: () => void
}

/**
 * ResultsCard redesigned as a premium iPhone-style bottom sheet drawer.
 * Slides up smoothly using spring physics, rendering stats inside a clean bento grid.
 */
export default function ResultsCard({ result, onRestart, onNewSession }: ResultsCardProps) {
  const correct = result.correctKeystrokes
  const total = result.totalKeystrokes

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
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280, mass: 0.8 }}
        className="relative w-full max-w-xl mx-auto bg-surface/80 border border-border border-b-0 backdrop-blur-[40px] rounded-t-[38px] p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pointer-events-auto flex flex-col select-none"
      >
        {/* iOS Drag Handle Indicator */}
        <div className="w-10 h-[5px] rounded-full bg-text-tertiary/30 mx-auto mb-6 mt-1 cursor-grab active:cursor-grabbing" />

        {/* Circular Close Button */}
        <button
          onClick={() => {
            playClickSound("click")
            onNewSession()
          }}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-surface-hover/80 hover:bg-surface-hover text-text-muted hover:text-text-primary flex items-center justify-center transition-colors active:scale-[0.97] cursor-pointer focus:outline-none"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Title */}
        <div className="text-center mt-2 mb-2">
          <span className="text-[11px] font-semibold tracking-wide text-accent font-sans block mb-1">
            Decryption report
          </span>
        </div>

        {/* Hero WPM Speed */}
        <div className="text-center my-6">
          <div className="relative inline-block">
            <span className="text-[48px] font-sans font-bold text-text-primary leading-none tracking-tight">
              {result.wpm}
            </span>
          </div>
          <span className="block text-xs text-text-secondary font-sans font-medium mt-3">
            Words per minute
          </span>
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
            <span className="text-text-primary font-semibold tabular-nums">{result.duration.toFixed(1)}s</span>
          </div>
          {/* Characters Correctness Row */}
          <div className="flex items-center justify-between px-4 py-3.5 text-[15px]">
            <span className="text-text-secondary font-medium">Correct Keys</span>
            <span className="text-text-primary font-semibold tabular-nums">{correct} / {total}</span>
          </div>
        </div>

        {/* Decryption status review subtext */}
        <div className="w-full text-center text-xs text-text-secondary leading-relaxed px-4 mb-6">
          {result.accuracy >= 95 
            ? "Rotor configuration synchronized. Decryption completed with extreme precision." 
            : "Decryption completed successfully, with mild cryptographic interference."}
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
    </div>
  )
}
