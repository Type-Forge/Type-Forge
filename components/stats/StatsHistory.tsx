"use client"

import { useState, useEffect } from "react"
import { useStatsStore } from "@/stores/stats-store"

/**
 * Redesigned StatsHistory.
 * Formats past sessions as a sleek logged feed with custom Lora serif headings
 * and quiet sans-serif metadata details.
 */
export default function StatsHistory() {
  const { history, clearHistory } = useStatsStore()
  const [limit, setLimit] = useState(5)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
      <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-text-muted">
          session history
        </span>
        <button
          onClick={clearHistory}
          className="text-xs text-text-muted hover:text-incorrect transition-colors duration-150 cursor-pointer font-medium"
        >
          clear log
        </button>
      </div>

      {/* Emil-like feed list layout */}
      <div className="flex flex-col gap-6">
        {visibleHistory.map((session) => {
          const isWordsMode = session.config.mode === "words"
          const eventTitle = isWordsMode
            ? `Decrypted ${session.config.wordCount} words`
            : `Completed timed decryption (${session.config.duration}s)`
          
          const detailsSubText = `${formatDate(session.timestamp)} · ${
            isWordsMode ? "words mode" : "timed mode"
          }`

          return (
            <div key={session.id} className="flex items-center justify-between py-1 group">
              {/* Event descriptive info */}
              <div className="flex flex-col">
                <span className="font-heading text-[17px] font-medium text-text-primary tracking-tight leading-snug transition-colors group-hover:text-accent">
                  {eventTitle}
                </span>
                <span className="text-xs text-text-secondary mt-0.5">
                  {detailsSubText}
                </span>
              </div>

              {/* Event speed metrics */}
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <span className="font-heading text-xl font-semibold text-accent leading-none">
                    {session.wpm}
                  </span>
                  <span className="text-[10px] text-text-muted font-sans font-semibold uppercase tracking-wider ml-1">
                    wpm
                  </span>
                </div>
                <div className="text-right min-w-[50px]">
                  <span className="font-mono text-sm font-semibold text-text-secondary leading-none">
                    {session.accuracy}%
                  </span>
                  <span className="text-[9px] text-text-muted block font-sans uppercase tracking-wider mt-0.5">
                    acc
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
            className="text-xs font-heading font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
          >
            show more logs
          </button>
        </div>
      )}
    </div>
  )
}
