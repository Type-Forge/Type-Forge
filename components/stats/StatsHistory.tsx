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
          className="text-xs font-medium text-text-tertiary hover:text-incorrect transition-colors duration-150 cursor-pointer"
        >
          Clear log
        </button>
      </div>

      {/* Bento-like card feed stack */}
      <div className="flex flex-col gap-3">
        {visibleHistory.map((session) => {
          const isWordsMode = session.config.mode === "words"
          const isBattleMode = session.config.mode === "battle"
          
          return (
            <div 
              key={session.id} 
              onClick={() => setSelectedSession(session)}
              className="relative flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group cursor-pointer active:scale-[0.99] overflow-hidden"
            >
              {/* Layout morphing background card */}
              <motion.div
                layoutId={`session-bg-${session.id}`}
                className="absolute inset-0 bg-surface border border-border rounded-2xl -z-10 group-hover:bg-surface-secondary transition-colors duration-200"
              />
              {/* Event descriptive info with custom tag icons */}
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isBattleMode
                    ? "bg-incorrect/5 border-incorrect/20 text-incorrect"
                    : isWordsMode 
                      ? "bg-accent/5 border-accent/20 text-accent" 
                      : "bg-text-primary/5 border-text-primary/10 text-text-primary"
                }`}>
                  {isBattleMode ? (
                    // Lightning bolt icon for battle mode
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : isWordsMode ? (
                    // Document icon for words mode
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    // Clock icon for timed mode
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-text-primary tracking-tight font-sans">
                    {isBattleMode 
                      ? `Battle (${session.config.difficulty})` 
                      : isWordsMode 
                        ? `${session.config.wordCount} words` 
                        : `${session.config.duration}s timed`}
                  </span>
                  <span className="text-[11px] text-text-muted mt-0.5 font-sans">
                    {formatDate(session.timestamp)}
                  </span>
                </div>
              </div>

              {/* Event speed & accuracy metrics */}
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <span className="font-mono text-xl font-extrabold text-accent leading-none">
                    {session.wpm}
                  </span>
                  <span className="text-[10px] text-text-muted font-sans font-medium ml-1">
                    WPM
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-border/40" />

                <div className="text-right min-w-[55px]">
                  <span className="font-mono text-sm font-semibold text-text-secondary leading-none">
                    {session.accuracy}%
                  </span>
                  <span className="text-[10px] text-text-muted block font-sans font-medium mt-0.5">
                    Accuracy
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-8 pt-4 border-t border-border/40">
          <button
            onClick={() => setLimit((prev) => prev + 5)}
            className="h-10 px-6 rounded-xl border border-border/40 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary bg-surface/10 hover:bg-surface-hover/80 cursor-pointer transition-[colors,background-color] duration-150"
          >
            show more logs
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

            {/* Modal Box Container (without layoutId so inner text isn't warped) */}
            <div
              className="relative w-full max-w-sm p-6 flex flex-col z-10"
            >
              {/* Animated morphing background element */}
              <motion.div
                layoutId={`session-bg-${selectedSession.id}`}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="absolute inset-0 bg-surface border border-border rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] -z-10"
              />

              {/* Fade in content to avoid visual distortion during shared layout expand */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="flex flex-col w-full relative z-10"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedSession(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-surface-secondary/80 hover:bg-surface-secondary text-text-muted hover:text-text-primary flex items-center justify-center transition-colors active:scale-95 cursor-pointer focus:outline-none"
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
                  <h3 className="text-lg font-heading font-extrabold text-text-primary">
                    {selectedSession.config.mode === "words" 
                      ? `${selectedSession.config.wordCount} words` 
                      : selectedSession.config.mode === "battle"
                        ? `Battle (${selectedSession.config.difficulty})`
                        : `${selectedSession.config.duration}s timed`}
                  </h3>
                  <span className="text-[11px] text-text-muted font-sans mt-0.5 block">
                    {formatDate(selectedSession.timestamp)}
                  </span>
                </div>

                {/* Stats Bento Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* WPM Card */}
                  <div className="bg-surface-secondary/40 border border-border/30 p-4 rounded-[20px] flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-mono font-extrabold text-accent leading-none">
                      {selectedSession.wpm}
                    </span>
                    <span className="text-[10px] tracking-wide font-medium text-text-secondary mt-2">
                      WPM speed
                    </span>
                  </div>

                  {/* Accuracy Card */}
                  <div className="bg-surface-secondary/40 border border-border/30 p-4 rounded-[20px] flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-mono font-extrabold text-text-primary leading-none">
                      {selectedSession.accuracy}%
                    </span>
                    <span className="text-[10px] tracking-wide font-medium text-text-secondary mt-2">
                      Accuracy
                    </span>
                  </div>

                  {/* Duration Card */}
                  <div className="bg-surface-secondary/40 border border-border/30 p-4 rounded-[20px] flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-mono font-bold text-text-primary leading-none">
                      {selectedSession.duration.toFixed(1)}s
                    </span>
                    <span className="text-[10px] tracking-wide font-medium text-text-secondary mt-2.5">
                      Time taken
                    </span>
                  </div>

                  {/* Keystrokes Card */}
                  <div className="bg-surface-secondary/40 border border-border/30 p-4 rounded-[20px] flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-mono font-bold text-text-primary leading-none">
                      {selectedSession.correctKeystrokes}/{selectedSession.totalKeystrokes}
                    </span>
                    <span className="text-[10px] tracking-wide font-medium text-text-secondary mt-2.5">
                      Keystrokes
                    </span>
                  </div>
                </div>

                {/* Extra Info Details */}
                <div className="bg-surface-secondary/30 rounded-[18px] p-3 text-xs text-text-secondary leading-relaxed mb-6 flex flex-col gap-1.5 border border-border/10 font-sans">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Words decrypted</span>
                    <span className="font-semibold text-text-primary">{selectedSession.wordsCompleted}</span>
                  </div>
                  <div className="h-[1px] bg-border/20 w-full" />
                  <div className="flex justify-between">
                    <span className="text-text-muted">Keystroke errors</span>
                    <span className="font-semibold text-incorrect">{selectedSession.incorrectKeystrokes}</span>
                  </div>
                </div>

                {/* Primary Dismiss Button */}
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-full h-12 rounded-2xl bg-accent hover:opacity-90 text-white font-sans text-xs font-bold uppercase tracking-widest transition-transform duration-150 active:scale-[0.98] cursor-pointer focus:outline-none shadow-sm"
                >
                  done
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
