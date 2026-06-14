"use client"

import { motion } from "motion/react"
import { useTheme } from "@/components/providers/ThemeProvider"
import { useEffect, useState } from "react"

/**
 * Animated Theme toggle switch between dark and light modes.
 * Uses spring physics for a quick responsive rotate animation.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure mounting completes to prevent server-side hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-hover transition-colors border border-border focus:outline-none cursor-pointer"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        {isDark ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-accent"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-accent"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </motion.div>
    </button>
  )
}
