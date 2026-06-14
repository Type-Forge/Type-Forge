"use client"

import Container from "@/components/ui/Container"
import BattleView from "@/components/battle/BattleView"
import Link from "next/link"

/**
 * Route page for Battle Mode.
 * Houses the back link to decrypted training and centers the racing arena.
 */
export default function BattlePage() {
  return (
    <Container className="flex flex-col flex-1 max-w-4xl py-4 relative">
      {/* Back Navigation */}
      <div className="mb-4 self-start">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors group cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Practice Mode
        </Link>
      </div>

      {/* Battle Tracks Arena */}
      <BattleView />
    </Container>
  )
}
