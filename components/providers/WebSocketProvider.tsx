"use client"

import { useEffect, ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useMultiplayerStore } from "@/stores/multiplayer-store"
import AlertModal from "@/components/ui/AlertModal"
import { useRouter } from "next/navigation"

interface WebSocketProviderProps {
  children: ReactNode
}

export default function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const connect = useMultiplayerStore((s) => s.connect)
  const disconnect = useMultiplayerStore((s) => s.disconnect)
  const incomingChallenge = useMultiplayerStore((s) => s.incomingChallenge)
  const respondToChallenge = useMultiplayerStore((s) => s.respondToChallenge)
  const activeRoomId = useMultiplayerStore((s) => s.activeRoomId)
  
  // Establish connection when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect(user.id)
    } else {
      disconnect()
    }
    
    return () => {
      disconnect()
    }
  }, [isAuthenticated, user?.id, connect, disconnect])

  // Redirect to battle route when activeRoomId is populated
  useEffect(() => {
    if (activeRoomId) {
      router.push(`/battle?room=${activeRoomId}`)
    }
  }, [activeRoomId, router])

  const handleDeclineChallenge = () => {
    if (incomingChallenge) {
      respondToChallenge(incomingChallenge.roomId, false)
    }
  }

  const handleAcceptChallenge = () => {
    if (incomingChallenge) {
      respondToChallenge(incomingChallenge.roomId, true)
    }
  }

  return (
    <>
      {children}
      
      {/* iOS style challenge modal dialog */}
      <AlertModal
        isOpen={!!incomingChallenge}
        onClose={handleDeclineChallenge}
        onConfirm={handleAcceptChallenge}
        title="Battle Challenge"
        message={`@${incomingChallenge?.challenger.username || "Friend"} has challenged you to a ${
          incomingChallenge?.mode === "timed"
            ? `${incomingChallenge?.value}s timed`
            : `${incomingChallenge?.value} words`
        } speed-typing battle! Do you accept?`}
        confirmText="Accept Battle"
        cancelText="Decline"
        type="destructive"
        closeOnConfirm={false}
      />
    </>
  )
}
