"use client"

import { useState, useEffect } from "react"
import { GroupedList } from "@/components/ui/GroupedList"
import WhiteCard from "@/components/ui/WhiteCard"
import { playClickSound } from "@/lib/audio"
import { useAuth } from "@/hooks/useAuth"
import { getSocialRelationsMap } from "@/app/actions/friends"
import LeaderboardRow from "@/components/leaderboard/LeaderboardRow"

interface LeaderboardEntryWithUser {
  id: string
  type: string
  wpm: number
  accuracy: number
  score: number
  updatedAt: Date
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
}

interface LeaderboardViewProps {
  initialTimed: LeaderboardEntryWithUser[]
  initialWords: LeaderboardEntryWithUser[]
}

export default function LeaderboardView({ initialTimed, initialWords }: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<"timed" | "words">("timed")
  const { user } = useAuth()
  const [relations, setRelations] = useState<
    Record<string, { status: "friends" | "pending_sent" | "pending_received"; requestId?: string }>
  >({})
  const [relationsLoaded, setRelationsLoaded] = useState(false)

  const loadRelations = async () => {
    if (!user?.id) {
      setRelationsLoaded(true)
      return
    }
    const res = await getSocialRelationsMap()
    if (res.success && res.relations) {
      setRelations(res.relations)
    }
    setRelationsLoaded(true)
  }

  useEffect(() => {
    if (user?.id) {
      loadRelations()
    }
  }, [user?.id])

  const leaders = activeTab === "timed" ? initialTimed : initialWords

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-6 animate-fade-in font-sans select-none">
      <WhiteCard>
        {/* Header and Tab Selector */}
        <div className="px-1 py-5 flex flex-col md:flex-row md:items-center justify-between border-b border-border/10 select-none gap-4">
          <div className="flex flex-col">
            <h2 className="text-[24px] font-bold tracking-tight text-text-primary">Leaderboard</h2>
            <p className="text-[15px] text-text-secondary mt-1">
              Top speed-typing runs of the community. Score is calculated as WPM &times; Accuracy.
            </p>
          </div>

          {/* iOS Segmented Control Selector */}
          <div className="bg-surface-secondary p-0.5 rounded-[8px] flex items-center gap-0.5 border border-border/10 self-start md:self-auto min-w-[260px]">
            <button
              onClick={() => {
                playClickSound("click")
                setActiveTab("timed")
              }}
              className={`flex-1 text-[13px] font-semibold py-1 px-3 md:px-4 rounded-[6px] transition-colors duration-100 active:scale-[0.97] cursor-pointer focus:outline-none whitespace-nowrap ${
                activeTab === "timed"
                  ? "bg-surface text-accent shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Timed Tests
            </button>
            <button
              onClick={() => {
                playClickSound("click")
                setActiveTab("words")
              }}
              className={`flex-1 text-[13px] font-semibold py-1 px-3 md:px-4 rounded-[6px] transition-colors duration-100 active:scale-[0.97] cursor-pointer focus:outline-none whitespace-nowrap ${
                activeTab === "words"
                  ? "bg-surface text-accent shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Words Sprint
            </button>
          </div>
        </div>

        {/* Leaderboard Table / Grouped List */}
        <div className="py-4">
          {leaders.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-text-tertiary text-xs text-center select-none font-sans">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 text-text-muted mb-3 animate-pulse"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                <path d="M12 2a6 6 0 0 0-6 6v3.5c0 1.66 1.34 3 3 3h6c1.66 0 3-1.34 3-3V8a6 6 0 0 0-6-6z" />
              </svg>
              <span className="font-semibold text-sm text-text-secondary">No typists yet.</span>
              <span className="text-text-tertiary mt-1">
                Complete a {activeTab === "timed" ? "timed run" : "words sprint"} to claim #1.
              </span>
            </div>
          ) : (
            <GroupedList>
              {leaders.map((leader, index) => {
                const rank = index + 1
                const relation = relations[leader.user.id] || { status: "none" }

                return (
                  <LeaderboardRow
                    key={leader.id}
                    rank={rank}
                    leader={leader}
                    currentUserId={user?.id || null}
                    friendshipStatus={
                      leader.user.id === user?.id ? "self" : (relation.status as any)
                    }
                    requestId={relation.requestId}
                    onActionSuccess={loadRelations}
                    relationsLoaded={relationsLoaded}
                  />
                )
              })}
            </GroupedList>
          )}
        </div>
      </WhiteCard>
    </div>
  )
}
