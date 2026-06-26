"use client"

import { motion, AnimatePresence } from "motion/react"
import { playClickSound } from "@/lib/audio"

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "primary" | "destructive"
  closeOnConfirm?: boolean
}

/**
 * Premium Apple HIG style Dialog Alert Modal.
 * Renders smooth spring scale animations, backdrop blur,
 * and exact light/dark iOS dialog system colors.
 */
export default function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "primary",
  closeOnConfirm = true,
}: AlertModalProps) {
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
            className="relative w-full max-w-[270px] bg-[#f2f2f7]/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[14px] p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.3)] flex flex-col items-center pointer-events-auto"
          >
            {/* Title */}
            <h4 className="text-[17px] font-bold text-black dark:text-white tracking-tight leading-snug">
              {title}
            </h4>

            {/* Message */}
            <p className="text-[13px] text-black/70 dark:text-white/70 mt-1.5 leading-normal">
              {message}
            </p>

            {/* Action buttons (horizontal iOS style) */}
            <div className="flex gap-2 w-full mt-4">
              <button
                onClick={() => {
                  playClickSound("click")
                  onClose()
                }}
                className="flex-1 h-9 rounded-lg bg-[#e5e5ea] dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] text-xs font-semibold hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  playClickSound("click")
                  onConfirm()
                  if (closeOnConfirm) {
                    onClose()
                  }
                }}
                className={`flex-1 h-9 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  type === "destructive"
                    ? "bg-[#ff3b30] dark:bg-[#ff453a] shadow-[0_2px_6px_rgba(255,59,48,0.2)]"
                    : "bg-[#007aff] dark:bg-[#0a84ff] shadow-[0_2px_6px_rgba(10,132,255,0.2)]"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
