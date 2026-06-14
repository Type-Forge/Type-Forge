"use client"

import { useState, useEffect } from "react"
import { useStatsStore } from "@/stores/stats-store"

/**
 * Lists past typing records retrieved from stats-store local state.
 * Supports chronological formatting and incremental lists expansion.
 */
export default function StatsHistory() {
  const { history, clearHistory } = useStatsStore()
  const [limit, setLimit] = useState(5)
  const [mounted, setMounted] = useState(false)

  // Wait for client mount to read local storage accurately
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-full max-w-xl mx-auto h-24 bg-surface/20 border border-border animate-pulse rounded-xl mt-8" />
  }

  if (history.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto text-center py-8 text-text-muted font-sans border border-border border-dashed rounded-xl mt-8 bg-surface/10">
        No sessions yet. Start decoding to build your log history.
      </div>
    )
  }

  const visibleHistory = history.slice(0, limit)
  const hasMore = history.length > limit

  return (
    <div className="w-full max-w-xl mx-auto mt-8 font-sans">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-xs font-heading font-bold uppercase tracking-widest text-text-secondary">
          Bletchley Decryption Logs
        </h3>
        <button
          onClick={clearHistory}
          className="text-xs text-incorrect hover:underline cursor-pointer transition-all font-semibold"
        >
          Clear History
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border/50 shadow-sm">
        {visibleHistory.map((result) => {
          const dateStr = new Date(result.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          const modeStr =
            result.config.mode === "words"
              ? `${result.config.wordCount} words`
              : `${result.config.duration}s`

          return (
            <div
              key={result.id}
              className="flex justify-between items-center px-6 py-3 hover:bg-surface-hover/30 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted">{dateStr}</span>
                <span className="text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">
                  {modeStr}
                </span>
              </div>
              <div className="flex gap-8 items-center">
                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-accent">
                    {result.wpm}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono ml-1">WPM</span>
                </div>
                <div className="text-right min-w-[70px]">
                  <span className="text-sm font-mono font-bold text-text-primary">
                    {result.accuracy}%
                  </span>
                  <span className="text-[10px] text-text-muted block leading-none">
                    Accuracy
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={() => setLimit((prev) => prev + 5)}
            className="text-xs font-heading font-bold uppercase tracking-wider text-accent hover:underline cursor-pointer"
          >
            Show More Logs
          </button>
        </div>
      )}
    </div>
  )
}
