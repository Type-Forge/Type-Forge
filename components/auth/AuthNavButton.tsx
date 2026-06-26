"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

// Navbar control: shows a Sign In link when logged out, and a Sign Out button when
// logged in. Styled to match the other circular glass controls in the Navbar.
export default function AuthNavButton() {
  const { isAuthenticated, isLoading, signOut } = useAuth()
  const router = useRouter()

  // Avoid a flash of the wrong state during session hydration.
  if (isLoading) {
    return <div className="w-8 h-8 rounded-full border border-border/10 bg-surface-secondary/40" />
  }

  if (isAuthenticated) {
    return (
      <button
        onClick={async () => {
          await signOut({ redirect: false })
          router.push("/")
          router.refresh()
        }}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-border/10 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 active:scale-[0.97] cursor-pointer focus:outline-none"
        aria-label="Sign out"
        title="Sign out"
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
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    )
  }

  return null
}
