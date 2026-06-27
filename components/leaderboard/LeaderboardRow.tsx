"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GroupedListItem } from "@/components/ui/GroupedList"
import { playClickSound } from "@/lib/audio"
import { sendFriendRequest, respondToFriendRequest } from "@/app/actions/friends"
import { toast } from "sonner"

interface LeaderboardRowProps {
  rank: number
  leader: {
    id: string
    wpm: number
    accuracy: number
    score: number
    updatedAt: Date | string
    user: {
      id: string
      name: string | null
      username: string | null
      image: string | null
    }
  }
  currentUserId: string | null
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "friends" | "self"
  requestId?: string
  onActionSuccess?: () => void
  relationsLoaded?: boolean
}

export default function LeaderboardRow({
  rank,
  leader,
  currentUserId,
  friendshipStatus,
  requestId,
  onActionSuccess,
  relationsLoaded = true,
}: LeaderboardRowProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // HIG-aligned Rank representation (no emojis, clean typography)
  let rankStyle = "text-text-secondary"
  if (rank === 1) rankStyle = "text-accent font-bold"
  else if (rank === 2) rankStyle = "text-text-primary font-bold opacity-80"
  else if (rank === 3) rankStyle = "text-text-primary font-bold opacity-60"

  const handleSendRequest = async () => {
    if (loading) return
    if (!currentUserId) {
      playClickSound("click")
      router.push("/signin?callbackUrl=/leaderboard")
      return
    }
    setLoading(true)
    playClickSound("click")
    const res = await sendFriendRequest(leader.user.id)
    if (res.success) {
      toast.success(`Friend request sent to ${leader.user.name || leader.user.username || "user"}`)
      onActionSuccess?.()
    } else {
      toast.error(res.error || "Failed to send request")
    }
    setLoading(false)
  }

  const handleRespondRequest = async (accept: boolean) => {
    if (loading || !requestId) return
    setLoading(true)
    playClickSound("click")
    const res = await respondToFriendRequest(requestId, accept)
    if (res.success) {
      toast.success(accept ? "Accepted friend request" : "Declined friend request")
      onActionSuccess?.()
    } else {
      toast.error(res.error || "Action failed")
    }
    setLoading(false)
  }

  // Render the appropriate friend request button
  const renderAction = () => {
    if (friendshipStatus === "self") return null

    if (!relationsLoaded) {
      return (
        <div className="w-[76px] h-[26px] rounded-[6px] bg-surface-secondary/60 animate-pulse" />
      )
    }

    if (!currentUserId || friendshipStatus === "none") {
      return (
        <button
          onClick={handleSendRequest}
          disabled={loading}
          className="px-2.5 py-1 text-[11px] font-bold rounded-[6px] bg-[#007aff]/10 dark:bg-[#0a84ff]/10 text-[#007aff] dark:text-[#0a84ff] border border-[#007aff]/20 dark:border-[#0a84ff]/20 hover:bg-[#007aff]/20 dark:hover:bg-[#0a84ff]/20 transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
        >
          Add Friend
        </button>
      )
    }

    if (friendshipStatus === "pending_sent") {
      return (
        <span className="text-[11px] font-semibold text-text-tertiary select-none">
          Requested
        </span>
      )
    }

    if (friendshipStatus === "pending_received") {
      return (
        <div className="flex gap-1.5">
          <button
            onClick={() => handleRespondRequest(true)}
            disabled={loading}
            className="px-2.5 py-1 text-[11px] font-bold rounded-[6px] bg-[#34c759]/10 dark:bg-[#30d158]/10 text-[#34c759] dark:text-[#30d158] border border-[#34c759]/20 dark:border-[#30d158]/20 hover:bg-[#34c759]/25 dark:hover:bg-[#30d158]/25 transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={() => handleRespondRequest(false)}
            disabled={loading}
            className="px-2.5 py-1 text-[11px] font-bold rounded-[6px] bg-[#ff3b30]/10 dark:bg-[#ff453a]/10 text-[#ff3b30] dark:text-[#ff453a] border border-[#ff3b30]/20 dark:border-[#ff453a]/20 hover:bg-[#ff3b30]/20 dark:hover:bg-[#ff453a]/20 transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )
    }

    if (friendshipStatus === "friends") {
      return (
        <div className="flex items-center gap-1 text-[12px] font-bold text-[#34c759] dark:text-[#30d158] select-none">
          <span className="text-xs">✓</span>
          <span>Friends</span>
        </div>
      )
    }

    return null
  }

  return (
    <GroupedListItem
      title={
        <div className="flex items-center gap-3 select-none">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full border border-border/10 bg-surface-secondary/40 flex items-center justify-center overflow-hidden shrink-0">
            {leader.user?.image ? (
              <img
                src={leader.user.image}
                alt={leader.user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-text-secondary">
                {(leader.user?.name || leader.user?.username || "?")
                  .substring(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>
          {/* Name and Username */}
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-text-primary leading-tight">
              {leader.user?.name || leader.user?.username || "Anonymous"}
            </span>
            {leader.user?.username && (
              <span className="text-[11px] text-text-tertiary">
                @{leader.user.username}
              </span>
            )}
          </div>
        </div>
      }
      icon={
        <div className={`w-6 text-center text-sm font-bold tabular-nums shrink-0 ${rankStyle}`}>
          {rank}
        </div>
      }
      rightElement={
        <div className="flex items-center gap-5 select-none font-sans tabular-nums text-right pr-1 shrink-0">
          {/* Speed & Precision */}
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-text-secondary leading-none">
              {leader.wpm.toFixed(1)} <span className="text-[10px] text-text-tertiary font-medium">WPM</span>
            </span>
            <span className="text-[10px] text-text-tertiary mt-1 leading-none">
              {(() => {
                const date = new Date(leader.updatedAt)
                if (isNaN(date.getTime())) return ""
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
              })()}
            </span>
          </div>
          {/* Calculated Score */}
          <div className="flex flex-col justify-center items-end border-l border-border/10 pl-4 h-8 min-w-[70px]">
            <span className="text-[15px] font-bold text-accent leading-none">
              {leader.score.toFixed(1)}
            </span>
            <span className="text-[9px] text-text-tertiary font-bold tracking-wide mt-1 leading-none uppercase">
              SCORE
            </span>
          </div>

          {/* Social action button */}
          <div className="border-l border-border/10 pl-4 h-8 flex items-center justify-center min-w-[125px]">
            {renderAction()}
          </div>
        </div>
      }
      className="py-2.5 px-4"
    />
  )
}
