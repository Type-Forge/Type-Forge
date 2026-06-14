import { useEffect } from "react"
import { useTypingStore } from "@/stores/typing-store"

/**
 * Handles countdown timer ticking for timed mode.
 * Synchronizes with useTypingStore's timeRemaining state.
 */
export function useCountdown(
  initialSeconds: number,
  onFinish: () => void,
  isRunning: boolean
): number {
  const timeRemaining = useTypingStore((s) => s.timeRemaining)
  const setTimeRemaining = useTypingStore((s) => s.setTimeRemaining)

  useEffect(() => {
    if (!isRunning) return

    const timer = setInterval(() => {
      const current = useTypingStore.getState().timeRemaining
      if (current === null) return

      if (current <= 1) {
        setTimeRemaining(0)
        clearInterval(timer)
        onFinish()
      } else {
        setTimeRemaining(current - 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, onFinish, setTimeRemaining])

  return timeRemaining ?? initialSeconds
}
