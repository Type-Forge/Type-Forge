"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { useTypingStore } from "@/stores/typing-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { CaretPosition } from "@/types"

interface CaretProps {
  position: CaretPosition
}

/**
 * Caret cursor absolute overlay.
 * Supports line, block, underline, and hidden styles based on user configurations.
 */
export default function Caret({ position }: CaretProps) {
  const status = useTypingStore((s) => s.status)
  const totalKeystrokes = useTypingStore((s) => s.totalKeystrokes)
  const [isTyping, setIsTyping] = useState(false)
  const caretStyle = useSettingsStore((s) => s.caretStyle)

  useEffect(() => {
    let active = true

    if (status !== "running") {
      requestAnimationFrame(() => {
        if (active) setIsTyping(false)
      })
      return
    }

    requestAnimationFrame(() => {
      if (active) setIsTyping(true)
    })
    const timeout = setTimeout(() => {
      if (active) setIsTyping(false)
    }, 2000)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [totalKeystrokes, status])

  if (caretStyle === "none") return null

  const shouldBlink = status === "ready" || status === "idle" || !isTyping

  let caretClass = "w-[3px] rounded-full bg-caret"
  let customStyle: React.CSSProperties = {
    height: position.height,
    transformOrigin: "center left",
  }

  if (caretStyle === "block") {
    caretClass = "w-[14px] bg-caret/35 rounded-[2px]"
  } else if (caretStyle === "underline") {
    caretClass = "w-[14px] h-[3px] bg-caret"
    customStyle = {
      transformOrigin: "center left",
      marginTop: `${position.height - 3}px`
    }
  }

  return (
    <motion.div
      className={`absolute top-0 left-0 z-10 pointer-events-none ${caretClass}`}
      animate={{
        transform: `translate(${position.left}px, ${position.top}px)`,
        opacity: shouldBlink ? [1, 0, 1] : 1,
      }}
      transition={{
        transform: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
        opacity: shouldBlink
          ? { duration: 1.0, repeat: Infinity, ease: "linear" as const }
          : { duration: 0.1 },
      }}
      style={customStyle}
    />
  )
}
