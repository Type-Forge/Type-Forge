"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { playClickSound } from "@/lib/audio"
import { getPendingRequests, respondToFriendRequest } from "@/app/actions/friends"
import AlertModal from "@/components/ui/AlertModal"
import { toast } from "sonner"

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
  onRequestHandled: () => void
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  onRequestHandled,
}: NotificationDrawerProps) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [declineId, setDeclineId] = useState<string | null>(null)
  const [declineName, setDeclineName] = useState("")

  const loadRequests = useCallback(async () => {
    setLoading(true)
    const res = await getPendingRequests()
    if (res.success && res.requests) {
      setRequests(res.requests)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadRequests()
    }
  }, [isOpen, loadRequests])

  const handleAccept = async (requestId: string) => {
    playClickSound("click")
    const res = await respondToFriendRequest(requestId, true)
    if (res.success) {
      toast.success("Friend request accepted!")
      onRequestHandled()
      loadRequests()
    } else {
      toast.error(res.error || "Failed to accept request")
    }
  }

  const handleDeclinePrompt = (requestId: string, name: string) => {
    playClickSound("click")
    setDeclineId(requestId)
    setDeclineName(name)
  }

  const handleConfirmDecline = async () => {
    if (!declineId) return
    const res = await respondToFriendRequest(declineId, false)
    if (res.success) {
      toast.success("Friend request declined.")
      onRequestHandled()
      loadRequests()
    } else {
      toast.error(res.error || "Failed to decline request")
    }
    setDeclineId(null)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[90] flex justify-end pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[3px] pointer-events-auto"
              onClick={() => {
                playClickSound("click")
                onClose()
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-[23vw] min-w-[320px] bg-white dark:bg-[#1c1c1e] border-l border-border/10 shadow-[-8px_0_30px_rgba(0,0,0,0.12)] pointer-events-auto flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 shrink-0">
                <h3 className="text-[17px] font-bold text-text-secondary">Notifications</h3>
                <button
                  onClick={() => {
                    playClickSound("click")
                    onClose()
                  }}
                  className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 text-text-primary"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-text-tertiary/30 border-t-text-primary rounded-full animate-spin" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-10 h-10 text-text-muted mb-3"
                    >
                      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                    </svg>
                    <span className="text-[14px] font-semibold text-text-secondary">No notifications</span>
                    <span className="text-[11px] text-text-tertiary mt-1">Friend requests will appear here</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-surface-secondary/50 border border-border/10 rounded-2xl p-4 flex items-start gap-3"
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full border border-border/10 bg-surface-secondary/40 flex items-center justify-center overflow-hidden shrink-0">
                          {req.sender.image ? (
                            <img
                              src={req.sender.image}
                              alt={req.sender.name || "Avatar"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] font-bold text-text-secondary">
                              {(req.sender.name || req.sender.username || "?")
                                .substring(0, 2)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-text-primary leading-snug">
                            {req.sender.name || req.sender.username || "Someone"}
                          </p>
                          <p className="text-[11px] text-text-tertiary mt-0.5">
                            sent you a friend request
                          </p>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-2.5">
                            <button
                              onClick={() => handleAccept(req.id)}
                              className="px-3 py-1 text-[11px] font-bold rounded-[6px] bg-[#34c759]/10 dark:bg-[#30d158]/10 text-[#34c759] dark:text-[#30d158] border border-[#34c759]/20 dark:border-[#30d158]/20 hover:bg-[#34c759]/20 dark:hover:bg-[#30d158]/20 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleDeclinePrompt(
                                  req.id,
                                  req.sender.name || req.sender.username || "this user"
                                )
                              }
                              className="px-3 py-1 text-[11px] font-bold rounded-[6px] bg-[#ff3b30]/10 dark:bg-[#ff453a]/10 text-[#ff3b30] dark:text-[#ff453a] border border-[#ff3b30]/20 dark:border-[#ff453a]/20 hover:bg-[#ff3b30]/15 dark:hover:bg-[#ff453a]/15 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decline Confirmation Modal */}
      <AlertModal
        isOpen={!!declineId}
        onClose={() => setDeclineId(null)}
        onConfirm={handleConfirmDecline}
        title="Decline Request"
        message={`Are you sure you want to decline the friend request from ${declineName}?`}
        confirmText="Yes, Decline"
        cancelText="No"
        type="destructive"
      />
    </>
  )
}
