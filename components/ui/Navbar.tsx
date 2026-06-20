"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTheme } from "@/components/providers/ThemeProvider"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import Logo from "@/components/ui/Logo"
import { playClickSound } from "@/lib/audio"

export default function Navbar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  const showBackChevron = pathname !== "/"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 apple-navbar flex items-center select-none">
      <div className="mx-auto max-w-7xl w-full flex items-center justify-between px-6 h-full">
        {/* Left Section: Traffic Lights, Back Chevron, & Logo */}
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 opacity-90 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dfa123]/40 opacity-90 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab2f]/40 opacity-90 shadow-sm" />
          </div>

          {/* Back Chevron */}
          {showBackChevron && (
            <Link
              href="/"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-150 active:scale-[0.95] cursor-pointer"
              aria-label="Back to trainer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          )}

          {/* Logo */}
          <div className="ml-1">
            <Logo />
          </div>
        </div>

        {/* Right Section: Utility circular glass controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {!mounted ? (
            <div className="w-9 h-9 rounded-full border border-border/10 bg-surface-secondary/40" />
          ) : (
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
              aria-label="Toggle theme"
            >
              <motion.div
                className="w-4 h-4 flex items-center justify-center"
                animate={{ rotate: theme === "dark" ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
              >
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
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
          )}

          {/* Settings Route Link */}
          <Link
            href="/settings"
            onClick={() => playClickSound("click")}
            className={`w-9 h-9 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer focus:outline-none ${
              pathname === "/settings" ? "border-accent/30 text-accent bg-accent/5 shadow-[0_0_8px_rgba(10,132,255,0.1)]" : ""
            }`}
            aria-label="Open Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>

          {/* Profile Route Link */}
          <Link
            href="/profile"
            onClick={() => playClickSound("click")}
            className={`w-9 h-9 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer ${
              pathname === "/profile" ? "border-accent/30 text-accent bg-accent/5 shadow-[0_0_8px_rgba(10,132,255,0.1)]" : ""
            }`}
            aria-label="View Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  )
}
