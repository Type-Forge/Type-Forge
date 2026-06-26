"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Container from "@/components/ui/Container"
import LiveBattleView from "./LiveBattleView"
import Link from "next/link"
import { useMultiplayerStore } from "@/stores/multiplayer-store"
import { playClickSound } from "@/lib/audio"

function BattleContent() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get("room")
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom)
  const resetMultiplayerState = useMultiplayerStore((s) => s.resetMultiplayerState)

  return (
    <Container className="flex flex-col flex-1 max-w-4xl py-4 relative">
      {/* Back Navigation */}
      <div className="mb-4 self-start select-none">
        <Link
          href="/friends"
          onClick={() => {
            playClickSound("click")
            if (roomId) {
              leaveRoom(roomId)
            } else {
              resetMultiplayerState()
            }
          }}
          className="flex items-center gap-1 text-sm font-sans font-medium text-text-secondary hover:text-text-primary transition-colors group cursor-pointer"
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
          Back to Friends
        </Link>
      </div>

      {/* Live Multiplayer Battle Room */}
      <LiveBattleView />
    </Container>
  )
}

/**
 * Route page for Battle Mode.
 * Centered multiplayer race arena wrapped in Suspense for useSearchParams usage.
 */
export default function BattlePage() {
  return (
    <Suspense
      fallback={
        <Container className="flex flex-col flex-1 max-w-4xl py-20 items-center justify-center font-sans text-xs text-text-tertiary">
          Loading battle arena...
        </Container>
      }
    >
      <BattleContent />
    </Suspense>
  )
}
