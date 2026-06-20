"use client"

import { useState } from "react"
import { useDrillStore } from "@/stores/drill-store"
import { playClickSound } from "@/lib/audio"
import AlertModal from "@/components/ui/AlertModal"
import CustomDrillBuilder from "./CustomDrillBuilder"

interface DrillDashboardProps {
  onStartDrill: () => void
}

/**
 * DrillDashboard component.
 * Layout displays intelligent adaptive trainer followed by
 * custom builder controls on a single integrated page.
 * Optimizes re-renders using granular sub-components.
 */
export default function DrillDashboard({ onStartDrill }: DrillDashboardProps) {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Subscribing to only the length of mistakeRecords & keyStats keys to determine if clearing is active
  const hasHistory = useDrillStore((s) => s.mistakeRecords.length > 0 || Object.keys(s.keyStats).length > 0)
  const resetStats = useDrillStore((s) => s.resetStats)

  return (
    <div className="w-full pt-1 pb-4 animate-fade-in font-sans space-y-6">
      {/* Custom Drill Builder */}
      <CustomDrillBuilder
        onStartDrill={onStartDrill}
        hasHistory={hasHistory}
        onDeleteClick={() => setIsClearModalOpen(true)}
      />

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
