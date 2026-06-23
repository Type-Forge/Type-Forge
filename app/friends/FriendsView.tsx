"use client"

import { useState, useEffect } from "react"
import { GroupedList, GroupedListItem } from "@/components/ui/GroupedList"
import WhiteCard from "@/components/ui/WhiteCard"
import { playClickSound } from "@/lib/audio"
import { useAuth } from "@/hooks/useAuth"
import {
  getFriendsList,
  getPendingRequests,
  searchUsers,
  respondToFriendRequest,
  sendFriendRequest,
  removeFriend,
} from "@/app/actions/friends"
import { useMultiplayerStore } from "@/stores/multiplayer-store"
import { toast } from "sonner"
import ChallengeModal from "@/components/battle/ChallengeModal"
import AlertModal from "@/components/ui/AlertModal"

export default function FriendsView() {
  const { user } = useAuth()
  
  // Realtime multi-player store state
  const onlineFriends = useMultiplayerStore((s) => s.onlineFriends)
  const sendChallenge = useMultiplayerStore((s) => s.sendChallenge)
  const isConnected = useMultiplayerStore((s) => s.isConnected)

  const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Custom challenge modal settings state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null)
  
  // Custom unfriend modal state
  const [unfriendTarget, setUnfriendTarget] = useState<{ id: string; name: string } | null>(null)

  const loadData = async () => {
    if (!user?.id) return
    setLoading(true)
    const [friendsRes, requestsRes] = await Promise.all([
      getFriendsList(),
      getPendingRequests(),
    ])
    if (friendsRes.success && friendsRes.friends) {
      setFriends(friendsRes.friends)
    }
    if (requestsRes.success && requestsRes.requests) {
      setRequests(requestsRes.requests)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const handleSearch = async (val: string) => {
    setSearchQuery(val)
    if (val.trim().length === 0) {
      setSearchResults([])
      return
    }
    const res = await searchUsers(val)
    if (res.success && res.users) {
      setSearchResults(res.users)
    }
  }

  const handleSendRequest = async (targetId: string, username: string) => {
    setActionLoading(`send-${targetId}`)
    playClickSound("click")
    const res = await sendFriendRequest(targetId)
    if (res.success) {
      toast.success(`Request sent to @${username}`)
      setSearchQuery("")
      setSearchResults([])
    } else {
      toast.error(res.error || "Failed to send request")
    }
    setActionLoading(null)
  }

  const handleRespond = async (requestId: string, accept: boolean) => {
    setActionLoading(`respond-${requestId}`)
    playClickSound("click")
    const res = await respondToFriendRequest(requestId, accept)
    if (res.success) {
      toast.success(accept ? "Request accepted!" : "Request declined.")
      loadData()
    } else {
      toast.error(res.error || "Failed to respond")
    }
    setActionLoading(null)
  }

  const handleUnfriendPrompt = (friendId: string, name: string) => {
    playClickSound("click")
    setUnfriendTarget({ id: friendId, name })
  }

  const handleConfirmUnfriend = async () => {
    if (!unfriendTarget) return
    const { id } = unfriendTarget
    setUnfriendTarget(null)
    setActionLoading(`unfriend-${id}`)
    playClickSound("click")
    const res = await removeFriend(id)
    if (res.success) {
      toast.success("Friend removed.")
      loadData()
    } else {
      toast.error(res.error || "Failed to remove friend")
    }
    setActionLoading(null)
  }

  const handleChallenge = (friendId: string, name: string) => {
    if (!isConnected) {
      toast.error("WebSocket not connected. Please wait a moment.")
      return
    }
    playClickSound("click")
    setSelectedFriend({ id: friendId, name })
    setIsChallengeModalOpen(true)
  }

  const handleConfirmChallenge = (mode: "words" | "timed", value: number) => {
    if (selectedFriend) {
      sendChallenge(selectedFriend.id, { mode, value })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 md:px-8 py-6 animate-fade-in font-sans select-none">
      <WhiteCard>
        {/* Header */}
        <div className="px-1 py-5 border-b border-border/10 select-none">
          <h2 className="text-[21px] font-bold tracking-tight text-text-primary">Friends</h2>
          <p className="text-sm text-text-secondary mt-1">
            Challenge your friends to real-time typing battles or manage requests.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center text-xs font-semibold text-text-tertiary">
            Loading friends data...
          </div>
        ) : (
          <div className="py-4 space-y-6">
            
            {/* 1. Pending Invites */}
            {requests.length > 0 && (
              <div className="space-y-2">
                <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider block px-1">
                  Friend Invites ({requests.length})
                </span>
                <GroupedList>
                  {requests.map((req) => (
                    <GroupedListItem
                      key={req.id}
                      title={
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-border/10 bg-surface-secondary/40 flex items-center justify-center overflow-hidden shrink-0">
                            {req.sender.image ? (
                              <img src={req.sender.image} alt={req.sender.name || "User"} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-text-secondary">
                                {(req.sender.name || req.sender.username || "?").substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-text-primary leading-tight">
                              {req.sender.name || "Anonymous"}
                            </span>
                            <span className="text-[11px] text-text-tertiary">@{req.sender.username}</span>
                          </div>
                        </div>
                      }
                      rightElement={
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRespond(req.id, true)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 text-[11px] font-bold rounded-[8px] bg-[#34c759] text-white hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, false)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 text-[11px] font-bold rounded-[8px] bg-surface-secondary text-text-primary border border-border/10 hover:bg-surface-hover transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      }
                      className="py-2.5 px-4"
                    />
                  ))}
                </GroupedList>
              </div>
            )}

            {/* 2. Add / Search Friends */}
            <div className="space-y-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider block px-1">
                Add Friend
              </span>
              <div className="flex items-center w-full bg-surface-secondary/40 border border-border/10 rounded-[10px] px-3 py-1.5 focus-within:border-accent/40 focus-within:bg-surface-secondary/60 transition-all duration-150">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users by name or @username..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm text-text-primary placeholder-text-tertiary/70 font-sans"
                />
              </div>

              {/* Search Results list */}
              {searchResults.length > 0 && (
                <div className="mt-1">
                  <GroupedList>
                    {searchResults.map((user) => {
                      const isFriend = friends.some((f) => f.id === user.id)
                      const isPending = requests.some((r) => r.senderId === user.id)
                      
                      return (
                        <GroupedListItem
                          key={user.id}
                          title={
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-border/10 bg-surface-secondary/40 flex items-center justify-center overflow-hidden shrink-0">
                                {user.image ? (
                                  <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-text-secondary">
                                    {(user.name || user.username || "?").substring(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-semibold text-text-primary leading-tight">
                                  {user.name || "Anonymous"}
                                </span>
                                <span className="text-[11px] text-text-tertiary">@{user.username}</span>
                              </div>
                            </div>
                          }
                          rightElement={
                            isFriend ? (
                              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider select-none px-2 py-0.5 rounded bg-surface-secondary border border-border/10">Friends</span>
                            ) : isPending ? (
                              <span className="text-xs font-bold text-text-tertiary select-none">Pending Inv</span>
                            ) : (
                              <button
                                onClick={() => handleSendRequest(user.id, user.username)}
                                disabled={actionLoading !== null}
                                className="px-3 py-1.5 text-[11px] font-bold rounded-[8px] bg-accent text-white hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
                              >
                                Send Invite
                              </button>
                            )
                          }
                          className="py-2.5 px-4"
                        />
                      )
                    })}
                  </GroupedList>
                </div>
              )}
            </div>

            {/* 3. My Friends */}
            <div className="space-y-2">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-wider block px-1">
                My Friends ({friends.length})
              </span>
              
              {friends.length === 0 ? (
                <div className="py-16 text-center text-xs text-text-tertiary bg-surface-secondary/10 border border-border/10 rounded-2xl select-none">
                  No friends added yet. Use the search bar to find and add typists.
                </div>
              ) : (
                <GroupedList>
                  {friends.map((friend) => {
                    const isOnline = onlineFriends.has(friend.id)
                    
                    return (
                      <GroupedListItem
                        key={friend.id}
                        title={
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-border/10 bg-surface-secondary/40 flex items-center justify-center overflow-hidden shrink-0 relative">
                              {friend.image ? (
                                <img src={friend.image} alt={friend.name || "User"} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-text-secondary">
                                  {(friend.name || friend.username || "?").substring(0, 2).toUpperCase()}
                                </span>
                              )}
                              
                              {/* Presence dot badge on avatar */}
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-secondary ${isOnline ? "bg-[#30d158]" : "bg-[#8e8e93]"}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-semibold text-text-primary leading-tight">
                                {friend.name || "Anonymous"}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-tertiary">
                                <span>@{friend.username}</span>
                                <span>&bull;</span>
                                <span className={isOnline ? "text-[#30d158] font-bold" : "text-text-tertiary"}>
                                  {isOnline ? "Online" : "Offline"}
                                </span>
                              </div>
                            </div>
                          </div>
                        }
                        rightElement={
                          <div className="flex items-center gap-3">
                            {isOnline && (
                              <button
                                onClick={() => handleChallenge(friend.id, friend.name || friend.username || "Friend")}
                                className="px-3 py-1.5 text-[11px] font-bold rounded-[8px] bg-accent text-white hover:opacity-90 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                              >
                                Challenge
                              </button>
                            )}
                            <button
                              onClick={() => handleUnfriendPrompt(friend.id, friend.name || friend.username || "Friend")}
                              disabled={actionLoading !== null}
                              className="w-7 h-7 flex items-center justify-center rounded-full border border-border/10 text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all duration-150 active:scale-[0.95] cursor-pointer disabled:opacity-50"
                              title="Remove Friend"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        }
                        className="py-2.5 px-4"
                      />
                    )
                  })}
                </GroupedList>
              )}
            </div>
          </div>
        )}
      </WhiteCard>

      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onConfirm={handleConfirmChallenge}
        friendName={selectedFriend?.name || "Friend"}
      />

      {/* Remove Friend Confirmation Alert Modal */}
      <AlertModal
        isOpen={!!unfriendTarget}
        onClose={() => setUnfriendTarget(null)}
        onConfirm={handleConfirmUnfriend}
        title="Remove Friend"
        message={`Are you sure you want to remove ${unfriendTarget?.name || "this friend"} from your friends?`}
        confirmText="Remove"
        cancelText="Cancel"
        type="destructive"
      />
    </div>
  )
}
