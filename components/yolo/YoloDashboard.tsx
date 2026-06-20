"use client"

import React from "react"
import { useYoloStore } from "@/stores/yolo-store"

interface YoloDashboardProps {
  onExit: () => void
}

export default function YoloDashboard({ onExit }: YoloDashboardProps) {
  const activeLetter = useYoloStore((s) => s.activeLetter)

  return (
    <div className="w-full py-1 animate-fade-in font-sans select-none flex justify-center">
      <span className="text-xs text-accent bg-accent/10 font-bold px-3 py-1 rounded-full select-none">
        Focus: <span>{activeLetter?.toUpperCase()}</span>
      </span>
    </div>
  )
}
