"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { useStatsStore } from "@/stores/stats-store"
import type { SessionResult } from "@/types"
import AlertModal from "@/components/ui/AlertModal"
import { GroupedList, GroupedListItem, ChevronIcon } from "@/components/ui/GroupedList"
import { playClickSound } from "@/lib/audio"
import AnalysisDrawer from "./AnalysisDrawer"

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

interface StatsHistoryProps {
  variant?: "drawer" | "dialog"
  showHeader?: boolean
  clearButtonStyle?: "text" | "red-button"
}

export default function StatsHistory({ variant = "drawer", showHeader = true, clearButtonStyle = "text" }: StatsHistoryProps) {
  const { history, clearHistory } = useStatsStore()
  const [filter, setFilter] = useState<"all" | "words" | "timed" | "battle" | "drill">("all")
  const [limit, setLimit] = useState(5)
  const [mounted, setMounted] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [hideRowId, setHideRowId] = useState<string | null>(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  const isDialog = variant === "dialog"

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  if (!mounted) {
    return <div className="w-full h-24 bg-transparent animate-pulse border-b border-border/10 mt-8" />
  }

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

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "words", label: "Words" },
    { value: "timed", label: "Timed" },
    { value: "battle", label: "Battle" },
    { value: "drill", label: "Drill" },
  ] as const

  return (
    <div className="w-full font-sans select-none animate-fade-in">
      {/* Category Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[17px] font-bold text-text-primary font-sans">
              Session History
            </span>
            
            {/* macOS Dropdown Popup Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-surface-secondary border border-border/10 px-2.5 py-1 rounded-[6px] flex items-center gap-1 text-[11px] text-text-primary font-semibold hover:bg-surface-hover active:scale-[0.97] transition-all duration-100 cursor-pointer focus:outline-none"
              >
                <span>{filterOptions.find(o => o.value === filter)?.label}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-text-secondary shrink-0 ml-0.5">
                  <path d="m7 15 5 5 5-5" />
                  <path d="m7 9 5-5 5 5" />
                </svg>
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-32 bg-surface border border-border/15 backdrop-blur-xl rounded-lg p-1 shadow-lg z-50 flex flex-col gap-0.5 animate-fade-in select-none">
                    {filterOptions.map((opt) => {
                      const isActive = filter === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFilter(opt.value as any)
                            setLimit(5)
                            setIsDropdownOpen(false)
                          }}
                          className={`px-2.5 py-1.5 rounded-md text-left text-[11px] font-semibold transition-colors duration-100 cursor-pointer flex items-center justify-between focus:outline-none ${
                            isActive
                              ? "bg-accent/10 text-accent hover:bg-accent hover:text-white"
                              : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isActive && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {clearButtonStyle === "red-button" ? (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="px-5 py-2 rounded-[10px] font-sans text-xs font-bold tracking-wide transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none flex items-center justify-center gap-1.5 bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/20 hover:bg-[#ff3b30]/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Clear Log
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="text-xs font-semibold text-text-tertiary hover:text-incorrect transition-colors duration-150 cursor-pointer active:scale-[0.97] focus:outline-none"
            >
              Clear log
            </button>
          )}
        </div>
      )}

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
            const isSelected = hideRowId === session.id
            
            return (
              <motion.div
                key={session.id}
                layoutId={isDialog ? `session-card-${session.id}` : undefined}
                className="w-full relative rounded-[10px] overflow-hidden"
                style={{ borderRadius: "10px" }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <div className={isSelected ? "opacity-0" : "opacity-100 transition-opacity duration-150"}>
                  <GroupedListItem
                    onClick={() => {
                      playClickSound("click")
                      if (isDialog) {
                        setHideRowId(session.id)
                      }
                      setSelectedSession(session)
                      setIsDrawerOpen(true)
                    }}
                    icon={null}
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
                </div>
              </motion.div>
            )
          })}
        </GroupedList>
      )}

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setLimit((prev) => prev + 5)}
            className="h-10 px-6 rounded-2xl border border-border bg-surface-secondary/40 text-[14px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80 cursor-pointer transition-all duration-150 active:scale-[0.97] focus:outline-none"
          >
            Show more
          </button>
        </div>
      )}

      {/* iOS-style Session Details Modal reusing AnalysisDrawer */}
      {selectedSession && (
        <AnalysisDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setTimeout(() => {
              setSelectedSession(null)
              if (isDialog) {
                setHideRowId(null)
              }
            }, 200)
          }}
          result={selectedSession}
          variant={variant}
          layoutId={isDialog ? `session-card-${selectedSession.id}` : undefined}
        />
      )}

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
