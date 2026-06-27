"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Container from "@/components/ui/Container"
import LiveBattleView from "./LiveBattleView"
import { useMultiplayerStore } from "@/stores/multiplayer-store"
import { playClickSound } from "@/lib/audio"
import Link from "next/link"

function BattleContent() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get("room")
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom)
  const resetMultiplayerState = useMultiplayerStore((s) => s.resetMultiplayerState)

  return (
    <div className="w-full flex-1 flex flex-col select-none">
      {/* Minimal back link — matches home page's clean top area */}
      <Container className="flex flex-col">
        <div className="mb-2 self-start">
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
            className="flex items-center gap-1 text-[13px] font-sans font-medium text-text-tertiary hover:text-text-secondary transition-colors group cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Friends
          </Link>
        </div>
      </Container>

      {/* Live Multiplayer Battle Room */}
      <LiveBattleView />
    </div>
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
