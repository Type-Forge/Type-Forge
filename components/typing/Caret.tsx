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
 * Uses hardware-accelerated transforms for spring movement follow, animating only transform and opacity.
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
      className="absolute w-[2.5px] rounded-full bg-caret z-10 pointer-events-none"
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
      style={{
        height: position.height,
        transformOrigin: "center left",
      }}
    />
  )
}
