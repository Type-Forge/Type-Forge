"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTheme } from "@/components/providers/ThemeProvider"
import { useEffect, useState, useCallback } from "react"
import { motion } from "motion/react"
import Logo from "@/components/ui/Logo"
import { playClickSound } from "@/lib/audio"
import NotificationDrawer from "@/components/notifications/NotificationDrawer"
import { getPendingRequests } from "@/app/actions/friends"

export default function Navbar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true)
    })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const loadPendingCount = useCallback(async () => {
    const res = await getPendingRequests()
    if (res.success && res.requests) {
      setPendingCount(res.requests.length)
    }
  }, [])

  useEffect(() => {
    loadPendingCount()
    const interval = setInterval(loadPendingCount, 30000)
    return () => clearInterval(interval)
  }, [loadPendingCount])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 apple-navbar flex items-center select-none">
        <motion.div
          className="mx-auto w-full flex items-center justify-between px-6 h-full"
          animate={{
            maxWidth: scrolled ? "72rem" : "80rem",
            marginTop: scrolled ? 8 : 0,
            backgroundColor: scrolled
              ? theme === "dark"
                ? "rgba(28, 28, 30, 0.85)"
                : "rgba(255, 255, 255, 0.85)"
              : "transparent",
            borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
            boxShadow: scrolled
              ? "0 1px 3px rgba(0,0,0,0.06)"
              : "0 0 0 rgba(0,0,0,0)",
            borderRadius: scrolled ? "12px" : "0px",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Left Section: Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Right Section: Utility circular glass controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {!mounted ? (
              <div className="w-8 h-8 rounded-full border border-border/10 bg-surface-secondary/40" />
            ) : (
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
                aria-label="Toggle theme"
              >
                <motion.div
                  className="w-[18px] h-[18px] flex items-center justify-center"
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
                      className="w-[18px] h-[18px]"
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
                      className="w-[18px] h-[18px]"
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

            {/* Notification Bell */}
            <button
              onClick={() => {
                playClickSound("click")
                setIsNotificationOpen(true)
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer focus:outline-none relative"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[18px] h-[18px]"
              >
                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
              </svg>
              {/* Red Badge */}
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff3b30] dark:bg-[#ff453a] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>

            {/* Leaderboard Route Link */}
            <Link
              href="/leaderboard"
              onClick={() => playClickSound("click")}
              className={`w-8 h-8 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer focus:outline-none ${
                pathname === "/leaderboard" ? "border-accent/30 text-accent bg-accent/5 shadow-[0_0_8px_rgba(10,132,255,0.1)]" : ""
              }`}
              aria-label="View Leaderboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[18px] h-[18px]"
              >
                <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
              </svg>
            </Link>

            {/* Settings Route Link */}
            <Link
              href="/settings"
              onClick={() => playClickSound("click")}
              className={`w-8 h-8 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer focus:outline-none ${
                pathname === "/settings" ? "border-accent/30 text-accent bg-accent/5 shadow-[0_0_8px_rgba(10,132,255,0.1)]" : ""
              }`}
              aria-label="Open Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[18px] h-[18px]"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </Link>

            {/* Profile Route Link */}
            <Link
              href="/profile"
              onClick={() => playClickSound("click")}
              className={`w-8 h-8 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer ${
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
                className="w-[18px] h-[18px]"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onRequestHandled={loadPendingCount}
      />
    </>
  )
}
