"use client"

import { useState } from "react"
import { useDrillStore } from "@/stores/drill-store"
import { playClickSound } from "@/lib/audio"
import AlertModal from "@/components/ui/AlertModal"
import IntelligentTrainer from "./IntelligentTrainer"
import CustomDrillBuilder from "./CustomDrillBuilder"
import WhiteCard from "@/components/ui/WhiteCard"

interface DrillDashboardProps {
  onStartDrill: () => void
}

/**
 * DrillDashboard component.
 * Layout displays Bletchley intelligent adaptive trainer followed by
 * custom builder controls on a single integrated page.
 * Optimizes re-renders using granular sub-components.
 */
export default function DrillDashboard({ onStartDrill }: DrillDashboardProps) {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Subscribing to only the length of mistakeRecords & keyStats keys to determine if clearing is active
  const hasHistory = useDrillStore((s) => s.mistakeRecords.length > 0 || Object.keys(s.keyStats).length > 0)
  const resetStats = useDrillStore((s) => s.resetStats)

  return (
    <div className="w-full py-4 animate-fade-in font-sans space-y-12">
      {/* 1. Profile Header & Rank (IntelligentTrainer) */}
      <IntelligentTrainer onStartDrill={onStartDrill} />

      {/* Divider */}
      <div className="border-b border-border/10" />

      {/* 2. Custom Drill Builder */}
      <CustomDrillBuilder onStartDrill={onStartDrill} />

      {/* 3. Delete Session Row at the bottom (iOS Settings Style) */}
      {hasHistory && (
        <div className="bg-surface-secondary/40 border border-border/10 rounded-[24px] p-6 mt-6">
          <WhiteCard>
            <div className="flex items-center justify-between py-4 px-1 select-none gap-4">
              <div className="space-y-0.5 text-left">
                <span className="text-[14px] font-bold text-text-primary block">
                  Delete session
                </span>
                <span className="text-[12px] text-text-secondary block leading-normal">
                  Permanently erase all typing ranks, metrics, and mistakes logs.
                </span>
              </div>
              <button
                onClick={() => {
                  playClickSound("click")
                  setIsClearModalOpen(true)
                }}
                className="h-8 px-5 rounded-full bg-white dark:bg-[#2c2c2e] border border-border/10 text-[#ff3b30] dark:text-[#ff453a] hover:bg-surface-hover/50 dark:hover:bg-[#3a3a3c] text-xs font-bold transition-all duration-150 active:scale-[0.97] cursor-pointer select-none shadow-sm"
              >
                Delete
              </button>
            </div>
          </WhiteCard>
        </div>
      )}

      {/* Clear Stats Confirmation Modal */}
      <AlertModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          resetStats()
          setIsClearModalOpen(false)
        }}
        title="Reset Profile Data?"
        message="This will permanently delete your analyzed keys, transitions, and mistake records. You will start with a fresh blank profile."
        confirmText="Reset Profile"
        type="destructive"
      />
    </div>
  )
}
