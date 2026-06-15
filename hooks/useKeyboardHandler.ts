import { useEffect } from "react"

/**
 * Attaches a keydown listener to the container ref.
 * Automatically intercepts appropriate inputs and forwards them to the game loop.
 */
export function useKeyboardHandler(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onKeyDown: (e: KeyboardEvent) => void,
  active: boolean
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container || !active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow standard browser modifier actions (e.g., Ctrl+R, Cmd+T, Ctrl+C), EXCEPT Backspace
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key !== "Backspace") return

      const key = e.key

      // Catch space, backspace, tab, escape, and standard character keys
      const isCharacter = key.length === 1 && /^[a-zA-Z]$/.test(key)
      const isSpace = key === " "
      const isBackspace = key === "Backspace"
      const isResetKey = key === "Tab" || key === "Escape"

      if (isCharacter || isSpace || isBackspace || isResetKey) {
        e.preventDefault()
        onKeyDown(e)
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    return () => {
      container.removeEventListener("keydown", handleKeyDown)
    }
  }, [containerRef, onKeyDown, active])
}
