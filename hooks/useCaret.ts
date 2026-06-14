import { useState, useEffect, useCallback } from "react"
import type { CaretPosition } from "@/types"

/**
 * Calculates the exact top/left coordinate of the caret relative to the TypingArea container.
 * Uses requestAnimationFrame to prevent layout thrashing and maintain 60fps animations.
 */
export function useCaret(
  containerRef: React.RefObject<HTMLDivElement | null>,
  wordIndex: number,
  letterIndex: number
): CaretPosition {
  const [position, setPosition] = useState<CaretPosition>({ top: 0, left: 0, height: 24 })

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    // 1. Try to find the active letter element directly
    const letterEl = container.querySelector(
      `[data-word-index="${wordIndex}"][data-letter-index="${letterIndex}"]`
    ) as HTMLElement | null

    if (letterEl) {
      const rect = letterEl.getBoundingClientRect()
      setPosition({
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        height: rect.height || 24,
      })
      return
    }

    // 2. If it is the space character (index = word length) or extra, position at the right of the previous letter
    if (letterIndex > 0) {
      const prevLetterEl = container.querySelector(
        `[data-word-index="${wordIndex}"][data-letter-index="${letterIndex - 1}"]`
      ) as HTMLElement | null

      if (prevLetterEl) {
        const rect = prevLetterEl.getBoundingClientRect()
        setPosition({
          top: rect.top - containerRect.top,
          left: rect.right - containerRect.left,
          height: rect.height || 24,
        })
        return
      }
    }

    // 3. Fallback to the start of the active word
    const wordEl = container.querySelector(`[data-word-index="${wordIndex}"]`) as HTMLElement | null
    if (wordEl) {
      const rect = wordEl.getBoundingClientRect()
      setPosition({
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        height: rect.height || 24,
      })
    }
  }, [wordIndex, letterIndex, containerRef])

  useEffect(() => {
    let animationFrameId: number

    const triggerUpdate = () => {
      animationFrameId = requestAnimationFrame(updatePosition)
    }

    // Trigger on change
    triggerUpdate()

    // Listen to resize/reflow changes
    window.addEventListener("resize", triggerUpdate)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", triggerUpdate)
    }
  }, [updatePosition, wordIndex, letterIndex])

  return position
}
