"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { useTypingStore } from "@/stores/typing-store"
import type { CaretPosition } from "@/types"

interface CaretProps {
  position: CaretPosition
}

/**
 * Caret cursor absolute overlay.
 * Uses hardware-accelerated transforms for spring movement follow.
 * Automatically switches to a 1s blink cycle when idle for more than 2 seconds.
 */
export default function Caret({ position }: CaretProps) {
  const status = useTypingStore((s) => s.status)
  const totalKeystrokes = useTypingStore((s) => s.totalKeystrokes)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (status !== "running") {
      setIsTyping(false)
      return
    }

    setIsTyping(true)
    const timeout = setTimeout(() => {
      setIsTyping(false)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [totalKeystrokes, status])

  const shouldBlink = status === "ready" || status === "idle" || !isTyping

  return (
    <motion.div
      className="absolute w-[2px] bg-caret z-10 pointer-events-none"
      animate={{
        x: position.left,
        y: position.top,
        height: position.height,
        opacity: shouldBlink ? [1, 0, 1] : 1,
      }}
      transition={{
        x: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
        y: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
        height: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
        opacity: shouldBlink
          ? { duration: 1.0, repeat: Infinity, ease: "linear" as const }
          : { duration: 0.1 },
      }}
      style={{
        transformOrigin: "center left",
      }}
    />
  )
}
