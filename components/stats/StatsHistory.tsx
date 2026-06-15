"use client"

import { useState, useEffect } from "react"
import { useStatsStore } from "@/stores/stats-store"
import { motion, AnimatePresence } from "motion/react"
import type { SessionResult } from "@/types"

/**
 * Redesigned StatsHistory.
 * Displays past session logs inside sleek, bento-grid cards with timeline indicators,
 * unified modern sans-serif typography, and fine-line dividers.
 */
export default function StatsHistory() {
  const { history, clearHistory } = useStatsStore()
  const [limit, setLimit] = useState(5)
  const [mounted, setMounted] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  if (!mounted) {
    return <div className="w-full max-w-xl mx-auto h-24 bg-transparent animate-pulse border-b border-border mt-8" />
  }

  if (history.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto text-center py-12 text-text-muted text-xs border-t border-border/40 mt-8">
        no sessions yet
      </div>
    )
  }

  const visibleHistory = history.slice(0, limit)
  const hasMore = history.length > limit

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-16 font-sans select-none animate-fade-in">
      {/* Category header */}
      <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-3">
        <span className="text-xs font-semibold text-text-secondary">
          Session history
        </span>
        <button
          onClick={clearHistory}
          className="text-xs font-medium text-text-tertiary hover:text-incorrect transition-colors duration-150 cursor-pointer active:scale-[0.97]"
        >
          Clear log
        </button>
      </div>

      {/* iOS Grouped List for Session History */}
      <div className="bg-surface-secondary/40 rounded-2xl border border-border/10 divide-y divide-border/10 overflow-hidden">
        {visibleHistory.map((session) => {
          const isWordsMode = session.config.mode === "words"
          const isBattleMode = session.config.mode === "battle"
          const isDrillMode = session.config.mode === "drill"
          
          return (
            <button 
              key={session.id} 
              onClick={() => setSelectedSession(session)}
              className="w-full flex items-center justify-between px-4 py-3.5 transition-all duration-150 active:scale-[0.97] active:bg-surface-hover/55 cursor-pointer text-left focus:outline-none"
            >
              {/* Event descriptive info */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-text-primary tracking-tight font-sans">
                    {isBattleMode 
                      ? `Battle (${session.config.difficulty})` 
                      : isWordsMode 
                        ? `${session.config.wordCount} words` 
                        : isDrillMode
                          ? `Drill (${session.config.difficulty})`
                          : `${session.config.duration}s timed`}
                  </span>
                  <span className="text-[12px] text-text-tertiary mt-0.5 font-sans">
                    {formatDate(session.timestamp)}
                  </span>
                </div>
              </div>

              {/* Event speed & accuracy metrics */}
              <div className="flex items-center gap-3">
                <div className="text-right flex flex-col items-end">
                  <span className="text-[16px] font-bold text-accent leading-none font-sans tabular-nums">
                    {session.wpm} <span className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide">WPM</span>
                  </span>
                  <span className="text-[12px] text-text-secondary font-sans mt-0.5 font-medium tabular-nums">
                    {session.accuracy}% acc
                  </span>
                </div>
                {/* Chevron icon indicating tap action */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-8 pt-4 border-t border-border/40">
          <button
            onClick={() => setLimit((prev) => prev + 5)}
            className="h-10 px-6 rounded-2xl border border-border bg-surface-secondary/40 text-[14px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80 cursor-pointer transition-all duration-150 active:scale-[0.97]"
          >
            Show more
          </button>
        </div>
      )}

      {/* iOS-style Session Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[4px] cursor-pointer"
              onClick={() => setSelectedSession(null)}
            />

            {/* Modal Box Container */}
            <div className="relative w-full max-w-sm p-6 flex flex-col z-10">
              {/* Modal background element */}
              <div className="absolute inset-0 bg-surface border border-border rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] -z-10" />

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col w-full relative z-10"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedSession(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-surface-secondary/80 hover:bg-surface-secondary text-text-muted hover:text-text-primary flex items-center justify-center transition-colors active:scale-[0.97] cursor-pointer focus:outline-none"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Title Section */}
                <div className="text-center mb-6 mt-2">
                  <span className="text-[11px] font-semibold tracking-wide text-accent font-sans block mb-1">
                    Decryption summary
                  </span>
                  <h3 className="text-lg font-sans font-bold text-text-primary">
                    {selectedSession.config.mode === "words" 
                      ? `${selectedSession.config.wordCount} words` 
                      : selectedSession.config.mode === "battle"
                        ? `Battle (${selectedSession.config.difficulty})`
                        : selectedSession.config.mode === "drill"
                          ? `Drill (${selectedSession.config.difficulty})`
                          : `${selectedSession.config.duration}s timed`}
                  </h3>
                  <span className="text-[11px] text-text-muted font-sans mt-0.5 block">
                    {formatDate(selectedSession.timestamp)}
                  </span>
                </div>

                {/* Stats Grouped List */}
                <div className="w-full mb-6 bg-surface-secondary/40 border border-border/10 divide-y divide-border/10 rounded-2xl overflow-hidden font-sans">
                  {/* WPM Row */}
                  <div className="flex justify-between items-center px-4 py-3.5 text-[15px]">
                    <span className="text-text-secondary font-medium">Speed</span>
                    <span className="font-bold text-accent tabular-nums">{selectedSession.wpm} WPM</span>
                  </div>
                  {/* Accuracy Row */}
                  <div className="flex justify-between items-center px-4 py-3.5 text-[15px]">
                    <span className="text-text-secondary font-medium">Accuracy</span>
                    <span className="font-semibold text-text-primary tabular-nums">{selectedSession.accuracy}%</span>
                  </div>
                  {/* Time taken Row */}
                  <div className="flex justify-between items-center px-4 py-3.5 text-[15px]">
                    <span className="text-text-secondary font-medium">Time Taken</span>
                    <span className="font-semibold text-text-primary tabular-nums">{selectedSession.duration.toFixed(1)}s</span>
                  </div>
                  {/* Keystrokes Row */}
                  <div className="flex justify-between items-center px-4 py-3.5 text-[15px]">
                    <span className="text-text-secondary font-medium">Keystrokes</span>
                    <span className="font-semibold text-text-primary tabular-nums">{selectedSession.correctKeystrokes} / {selectedSession.totalKeystrokes}</span>
                  </div>
                </div>

                {/* Metadata Grouped List */}
                <div className="w-full mb-6 bg-surface-secondary/35 border border-border/10 divide-y divide-border/10 rounded-2xl overflow-hidden font-sans">
                  <div className="flex justify-between items-center px-4 py-3 text-[14px]">
                    <span className="text-text-tertiary">Words decrypted</span>
                    <span className="font-semibold text-text-primary">{selectedSession.wordsCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 text-[14px]">
                    <span className="text-text-tertiary">Keystroke errors</span>
                    <span className="font-semibold text-incorrect">{selectedSession.incorrectKeystrokes}</span>
                  </div>
                </div>

                {/* Primary Dismiss Button */}
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-full h-12 rounded-2xl bg-accent hover:opacity-90 text-white font-sans text-[15px] font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none shadow-sm"
                >
                  Done
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
