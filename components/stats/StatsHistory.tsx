"use client"

import { useState, useEffect } from "react"
import { useStatsStore } from "@/stores/stats-store"

/**
 * Lists past typing records with minimalist dividers.
 * Fully responsive list, removing borders and heavy outlines.
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
      <div className="w-full max-w-xl mx-auto text-center py-8 text-text-muted text-sm border-t border-border mt-8">
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
    <div className="w-full max-w-xl mx-auto mt-12 font-sans select-none">
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted">
          session history
        </span>
        <button
          onClick={clearHistory}
          className="text-xs text-text-muted hover:text-incorrect transition-colors duration-150 cursor-pointer"
        >
          clear
        </button>
      </div>

      {/* Clean divide-y row list */}
      <div className="divide-y divide-border">
        {visibleHistory.map((session) => (
          <div key={session.id} className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-text-primary">
                {session.config.wordCount ?? session.config.duration + "s"} {session.config.mode}
              </span>
              <span className="text-xs text-text-muted">
                {formatDate(session.timestamp)}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm font-mono tabular-nums text-accent">
                {session.wpm} <span className="text-[10px] text-text-muted">wpm</span>
              </span>
              <span className="text-sm font-mono tabular-nums text-text-secondary">
                {session.accuracy}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={() => setLimit((prev) => prev + 5)}
            className="text-xs font-heading font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
          >
            show more
          </button>
        </div>
      )}
    </div>
  )
}
