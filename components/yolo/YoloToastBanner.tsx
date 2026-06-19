"use client"

import React from "react"
import { playClickSound } from "@/lib/audio"

interface YoloToastBannerProps {
  toastId: string | number
  icon: string
  title: string
  description: string
  onClose: (id: string | number) => void
}

export function YoloToastBanner({
  toastId,
  icon,
  title,
  description,
  onClose,
}: YoloToastBannerProps) {
  return (
    <div
      className="w-full max-w-[320px] bg-white border border-black/10 rounded-[24px] p-4 flex items-start gap-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all duration-200 pointer-events-auto"
      style={{ contentVisibility: "auto" }}
    >
      {/* Notification Icon */}
      <div className="w-9 h-9 rounded-full bg-[#f2f2f7] border border-black/5 flex items-center justify-center text-lg select-none shrink-0 shadow-sm">
        {icon}
      </div>

      {/* Title & Description */}
      <div className="flex-1 text-left font-sans min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <h4 className="text-[13px] font-bold text-black truncate">
            {title}
          </h4>
          <span className="text-[10px] text-black/40 select-none shrink-0 font-medium lowercase">
            now
          </span>
        </div>
        <p className="text-[11px] text-black/70 mt-1 leading-normal whitespace-pre-line font-medium break-words">
          {description}
        </p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => {
          playClickSound("click")
          onClose(toastId)
        }}
        className="text-black/45 hover:text-black/70 font-bold text-[14px] cursor-pointer shrink-0 pl-1 active:scale-[0.9] transition-all duration-150"
      >
        ×
      </button>
    </div>
  )
}
