"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { playClickSound } from "@/lib/audio"

interface ChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (mode: "words" | "timed", value: number) => void
  friendName: string
}

/**
 * Apple HIG-style Alert Dialog Modal for selecting multiplayer challenge modes.
 * Features premium glassmorphism, smooth spring animations, and segmented controls.
 */
export default function ChallengeModal({
  isOpen,
  onClose,
  onConfirm,
  friendName,
}: ChallengeModalProps) {
  const [mode, setMode] = useState<"words" | "timed">("words")
  const [wordsValue, setWordsValue] = useState<number>(25)
  const [timedValue, setTimedValue] = useState<number>(30)

  const handleModeChange = (newMode: "words" | "timed") => {
    playClickSound("click")
    setMode(newMode)
  }

  const handleWordsValueChange = (val: number) => {
    playClickSound("click")
    setWordsValue(val)
  }

  const handleTimedValueChange = (val: number) => {
    playClickSound("click")
    setTimedValue(val)
  }

  const handleSend = () => {
    playClickSound("click")
    const value = mode === "words" ? wordsValue : timedValue
    onConfirm(mode, value)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px] pointer-events-auto"
            onClick={() => {
              playClickSound("click")
              onClose()
            }}
          />

          {/* Modal Alert Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[280px] bg-[#f2f2f7]/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[14px] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.3)] flex flex-col items-center pointer-events-auto font-sans"
          >
            {/* Title */}
            <h4 className="text-[17px] font-bold text-black dark:text-white tracking-tight leading-snug">
              Challenge @{friendName}
            </h4>

            {/* Message */}
            <p className="text-[13px] text-black/70 dark:text-white/70 mt-1.5 leading-normal">
              Select your preferred game mode and settings for this speed-typing duel.
            </p>

            {/* 1. Mode Segmented Control */}
            <div className="w-full mt-4 bg-black/5 dark:bg-white/5 p-0.5 rounded-[8px] flex items-center justify-between border border-black/5 dark:border-white/5 relative">
              <button
                onClick={() => handleModeChange("words")}
                className={`flex-1 text-[13px] font-semibold py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] focus:outline-none cursor-pointer ${
                  mode === "words"
                    ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Words
              </button>
              <button
                onClick={() => handleModeChange("timed")}
                className={`flex-1 text-[13px] font-semibold py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] focus:outline-none cursor-pointer ${
                  mode === "timed"
                    ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Timed
              </button>
            </div>

            {/* 2. Value Segmented Control depending on Mode */}
            <div className="w-full mt-3 bg-black/5 dark:bg-white/5 p-0.5 rounded-[8px] flex items-center justify-between border border-black/5 dark:border-white/5 relative">
              {mode === "words" ? (
                <>
                  <button
                    onClick={() => handleWordsValueChange(15)}
                    className={`flex-1 text-[13px] font-semibold py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] focus:outline-none cursor-pointer ${
                      wordsValue === 15
                        ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    15 Words
                  </button>
                  <button
                    onClick={() => handleWordsValueChange(25)}
                    className={`flex-1 text-[13px] font-semibold py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] focus:outline-none cursor-pointer ${
                      wordsValue === 25
                        ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    25 Words
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleTimedValueChange(15)}
                    className={`flex-1 text-[13px] font-semibold py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] focus:outline-none cursor-pointer ${
                      timedValue === 15
                        ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    15s
                  </button>
                  <button
                    onClick={() => handleTimedValueChange(30)}
                    className={`flex-1 text-[13px] font-semibold py-1 rounded-[6px] transition-all duration-150 active:scale-[0.97] focus:outline-none cursor-pointer ${
                      timedValue === 30
                        ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    30s
                  </button>
                </>
              )}
            </div>

            {/* Action buttons (horizontal iOS style) */}
            <div className="flex gap-2 w-full mt-4">
              <button
                onClick={() => {
                  playClickSound("click")
                  onClose()
                }}
                className="flex-1 h-9 rounded-lg bg-[#e5e5ea] dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] text-xs font-semibold hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 h-9 rounded-lg bg-[#007aff] dark:bg-[#0a84ff] text-white text-xs font-bold hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-[0_2px_6px_rgba(10,132,255,0.2)]"
              >
                Challenge
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
