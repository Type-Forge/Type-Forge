"use client"

import { useState, useEffect } from "react"
import { useStatsStore } from "@/stores/stats-store"
import { motion, AnimatePresence } from "motion/react"
import type { SessionResult } from "@/types"
import AlertModal from "@/components/ui/AlertModal"
import FloatingPillTabs, { TabOption } from "@/components/ui/FloatingPillTabs"
import { GroupedList, GroupedListItem, ChevronIcon } from "@/components/ui/GroupedList"

// Icons representing each session mode
const WordsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-text-secondary">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
)

const TimedIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-text-secondary">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const BattleIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-500">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const DrillIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

function getSessionIcon(mode: string) {
  switch (mode) {
    case "words": return WordsIcon
    case "timed": return TimedIcon
    case "battle": return BattleIcon
    case "drill": return DrillIcon
    default: return WordsIcon
  }
}

/**
 * Re-architected StatsHistory using iPadOS list/menu aesthetics.
 * Adds dynamic capsule filter controls matching the Apple Edit Menu specifications.
 */
export default function StatsHistory() {
  const { history, clearHistory } = useStatsStore()
  const [filter, setFilter] = useState<"all" | "words" | "timed" | "battle" | "drill">("all")
  const [limit, setLimit] = useState(5)
  const [mounted, setMounted] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  if (!mounted) {
    return <div className="w-full max-w-xl mx-auto h-24 bg-transparent animate-pulse border-b border-border mt-8" />
  }

  // Filter history based on selected capsule tab
  const filteredHistory = history.filter((session) => {
    if (filter === "all") return true
    return session.config.mode === filter
  })

  const visibleHistory = filteredHistory.slice(0, limit)
  const hasMore = filteredHistory.length > limit

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filterOptions: TabOption[] = [
    { value: "all", label: "All" },
    { value: "words", label: "Words" },
    { value: "timed", label: "Timed" },
    { value: "battle", label: "Battle" },
    { value: "drill", label: "Drill" },
  ]

  return (
    <div className="w-full max-w-xl mx-auto mt-16 font-sans select-none animate-fade-in">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-3">
        <span className="text-xs font-semibold text-text-secondary">
          Session history
        </span>
        <button
          onClick={() => setIsClearModalOpen(true)}
          className="text-xs font-medium text-text-tertiary hover:text-incorrect transition-colors duration-150 cursor-pointer active:scale-[0.97] focus:outline-none"
        >
          Clear log
        </button>
      </div>

      {/* Floating horizontal capsule filter bar (iPadOS Edit Menu layout) */}
      <div className="flex justify-center mb-6">
        <FloatingPillTabs
          options={filterOptions}
          activeValue={filter}
          onChange={(val) => {
            setFilter(val as any)
            setLimit(5) // Reset list view limit on filter change
          }}
          layoutId="active-history-filter"
        />
      </div>

      {/* Grouped List log view */}
      {filteredHistory.length === 0 ? (
        <div className="w-full text-center py-12 text-text-muted text-xs bg-surface-secondary/10 border border-border/5 rounded-2xl">
          no {filter !== "all" ? `${filter} ` : ""}sessions found
        </div>
      ) : (
        <GroupedList>
          {visibleHistory.map((session) => {
            const isWordsMode = session.config.mode === "words"
            const isBattleMode = session.config.mode === "battle"
            const isDrillMode = session.config.mode === "drill"
            
            return (
              <GroupedListItem
                key={session.id}
                onClick={() => setSelectedSession(session)}
                icon={getSessionIcon(session.config.mode)}
                title={
                  isBattleMode 
                    ? `Battle (${session.config.difficulty})` 
                    : isWordsMode 
                      ? `${session.config.wordCount} words` 
                      : isDrillMode
                        ? `Drill (${session.config.difficulty})`
                        : `${session.config.duration}s timed`
                }
                subtitle={formatDate(session.timestamp)}
                rightElement={
                  <div className="flex items-center gap-3">
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[15px] font-bold text-accent leading-none font-sans tabular-nums">
                        {session.wpm} <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">WPM</span>
                      </span>
                      <span className="text-[11px] text-text-secondary font-sans mt-0.5 font-medium tabular-nums">
                        {session.accuracy}% acc
                      </span>
                    </div>
                    <ChevronIcon />
                  </div>
                }
              />
            )
          })}
        </GroupedList>
      )}

      {hasMore && (
        <div className="text-center mt-8 pt-4 border-t border-border/40">
          <button
            onClick={() => setLimit((prev) => prev + 5)}
            className="h-10 px-6 rounded-2xl border border-border bg-surface-secondary/40 text-[14px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80 cursor-pointer transition-all duration-150 active:scale-[0.97] focus:outline-none"
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
                <GroupedList className="mb-6 bg-surface-secondary/40 font-sans">
                  <GroupedListItem
                    title="Speed"
                    rightElement={<span className="font-bold text-accent tabular-nums">{selectedSession.wpm} WPM</span>}
                  />
                  <GroupedListItem
                    title="Accuracy"
                    rightElement={<span className="font-semibold text-text-primary tabular-nums">{selectedSession.accuracy}%</span>}
                  />
                  <GroupedListItem
                    title="Time Taken"
                    rightElement={<span className="font-semibold text-text-primary tabular-nums">{selectedSession.duration.toFixed(1)}s</span>}
                  />
                  <GroupedListItem
                    title="Keystrokes"
                    rightElement={<span className="font-semibold text-text-primary tabular-nums">{selectedSession.correctKeystrokes} / {selectedSession.totalKeystrokes}</span>}
                  />
                </GroupedList>

                {/* Metadata Grouped List */}
                <GroupedList className="mb-6 bg-surface-secondary/35 font-sans">
                  <GroupedListItem
                    title="Words decrypted"
                    className="py-2.5"
                    rightElement={<span className="font-semibold text-text-primary">{selectedSession.wordsCompleted}</span>}
                  />
                  <GroupedListItem
                    title="Keystroke errors"
                    className="py-2.5"
                    destructive
                    rightElement={<span className="font-semibold text-incorrect">{selectedSession.incorrectKeystrokes}</span>}
                  />
                </GroupedList>

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

      <AlertModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearHistory}
        title="Clear Session History"
        message="Are you sure you want to clear your session history? This will delete all your stats."
        confirmText="Clear"
        type="destructive"
      />
    </div>
  )
}
