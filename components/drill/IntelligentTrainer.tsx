"use client"

import { useMemo } from "react"

interface IntelligentTrainerProps {
  onStartDrill: () => void
}

export default function IntelligentTrainer({ onStartDrill }: IntelligentTrainerProps) {
  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }, [])

  return (
    <div className="space-y-8 py-2 font-sans select-none">
      {/* Screen 1: Drill Profile */}
      <div className="space-y-6">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">
            Drill Profile
          </span>
          <h2 className="text-[32px] font-bold text-text-primary leading-tight tracking-tight mt-1">
            {greeting}
          </h2>
        </div>
      </div>
    </div>
  )
}
