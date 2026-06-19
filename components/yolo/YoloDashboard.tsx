"use client"

import React, { useState } from "react"
import { useYoloStore } from "@/stores/yolo-store"
import { useTypingStore } from "@/stores/typing-store"
import { playClickSound } from "@/lib/audio"
import AlertModal from "@/components/ui/AlertModal"

interface YoloDashboardProps {
  onExit: () => void
}

export default function YoloDashboard({ onExit }: YoloDashboardProps) {
  const activeLetter = useYoloStore((s) => s.activeLetter)
  const streak = useYoloStore((s) => s.streak)
  const startFresh = useYoloStore((s) => s.startFresh)
  const initSession = useTypingStore((s) => s.initSession)

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const handleStartFresh = () => {
    playClickSound("click")
    startFresh()
    initSession({ mode: "yolo" })
    setIsResetModalOpen(false)
  }

  return (
    <div className="w-full py-1 animate-fade-in font-sans select-none">
      {/* Header Toolbar (Unified, Compact, Minimalist) */}
      <div className="flex items-center justify-between gap-4 border-b border-border/10 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-bold text-text-primary tracking-tight">
            YOLO Mode
          </h2>
          <span className="text-xs text-text-tertiary font-medium">
            •
          </span>
          <span className="text-xs text-accent bg-accent/10 font-bold px-2.5 py-1 rounded-full select-none">
            Focus: <span>{activeLetter?.toUpperCase()}</span>
          </span>
          {streak > 0 && (
            <span className="text-xs text-[#ff9500] bg-[#ff9500]/10 font-bold px-2.5 py-1 rounded-full select-none">
              🔥 {streak} streak
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClickSound("click")
              setIsResetModalOpen(true)
            }}
            className="h-8 px-3 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary text-[11px] font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound("click")
              onExit()
            }}
            className="h-8 px-3 rounded-lg bg-[#ff3b30] hover:bg-[#e03126] text-white text-[11px] font-bold transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-sm"
          >
            Quit
          </button>
        </div>
      </div>

      {/* Reset progress confirmation modal */}
      <AlertModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleStartFresh}
        title="Reset YOLO Progress?"
        message="This will completely clear your YOLO letter profiles, mastered keys count, and reset you back to your weakest key (or 'E'). This cannot be undone."
        confirmText="Reset Progress"
        type="destructive"
      />
    </div>
  )
}
