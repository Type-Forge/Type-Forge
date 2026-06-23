"use client"

import { useEffect } from "react"
import { useMultiplayerStore } from "@/stores/multiplayer-store"
import { useTypingStore } from "@/stores/typing-store"
import { useBattleStore } from "@/stores/battle-store"
import { getSeededBattleWords } from "@/lib/words/seeded"
import { initializeWords } from "@/engine/typing-engine"
import TypingArea from "@/components/typing/TypingArea"
import StatsBar from "@/components/stats/StatsBar"
import WhiteCard from "@/components/ui/WhiteCard"
import Link from "next/link"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { playClickSound } from "@/lib/audio"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import MultiplayerResultsCard from "@/components/battle/MultiplayerResultsCard"
import { computeSessionTimelineAndErrors } from "@/lib/utils"
import type { SessionResult, WordCount, TimeDuration } from "@/types"
import { useCountdown } from "@/hooks/useCountdown"

export default function LiveBattleView() {
  const router = useRouter()
  const socket = useMultiplayerStore((s) => s.socket)
  const isConnected = useMultiplayerStore((s) => s.isConnected)
  const activeRoomId = useMultiplayerStore((s) => s.activeRoomId)
  const activeRoomSeed = useMultiplayerStore((s) => s.activeRoomSeed)
  const activeRoomMode = useMultiplayerStore((s) => s.activeRoomMode)
  const activeRoomValue = useMultiplayerStore((s) => s.activeRoomValue)
  const activeRoomStatus = useMultiplayerStore((s) => s.activeRoomStatus)
  const opponent = useMultiplayerStore((s) => s.opponent)
  const opponentProgress = useMultiplayerStore((s) => s.opponentProgress)
  const countdownRemaining = useMultiplayerStore((s) => s.countdownRemaining)
  const battleResult = useMultiplayerStore((s) => s.battleResult)
  const sendProgress = useMultiplayerStore((s) => s.sendProgress)
  const sendFinish = useMultiplayerStore((s) => s.sendFinish)
  const resetMultiplayerState = useMultiplayerStore((s) => s.resetMultiplayerState)
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom)
  const isLeavingRoom = useMultiplayerStore((s) => s.isLeavingRoom)
  const waitingForOpponent = useMultiplayerStore((s) => s.waitingForOpponent)
  const playerOneId = useMultiplayerStore((s) => s.playerOneId)
  const playerTwoId = useMultiplayerStore((s) => s.playerTwoId)

  const { user } = useAuth()
  const currentUserId = user?.id || socket?.url?.split("userId=")[1]?.split("&")[0] || ""
  const isPlayerOne = currentUserId === playerOneId

  const currentWordIndex = useTypingStore((s) => s.currentWordIndex)
  const currentLetterIndex = useTypingStore((s) => s.currentLetterIndex)
  const typingStatus = useTypingStore((s) => s.status)
  const words = useTypingStore((s) => s.words)

  const searchParams = useSearchParams()
  const urlRoomId = searchParams.get("room")

  // Reset leaving state on mount
  useEffect(() => {
    useMultiplayerStore.setState({ isLeavingRoom: false })
  }, [])

  // Client-driven explicit room join/restore fallback on direct load or reconnects
  useEffect(() => {
    if (isConnected && socket && socket.readyState === 1 && urlRoomId && !activeRoomId && !isLeavingRoom) {
      socket.send(
        JSON.stringify({
          type: "join-room",
          roomId: urlRoomId,
        })
      )
    }
  }, [isConnected, socket, urlRoomId, activeRoomId, isLeavingRoom])

  // Bind key capture events and fetch live metrics
  const { wpm, accuracy } = useTypingEngine()

  // 1. Initialize words based on room seed
  useEffect(() => {
    if (activeRoomSeed) {
      const parts = activeRoomSeed.split("_")
      let roomMode: "words" | "timed" = "words"
      let roomValue = 25
      let actualSeed = activeRoomSeed
      
      if (parts.length >= 3) {
        roomMode = parts[0] === "timed" ? "timed" : "words"
        roomValue = parseInt(parts[1], 10) || 25
        actualSeed = parts.slice(2).join("_")
      }

      const count = roomMode === "words" ? roomValue : 150
      const rawWords = getSeededBattleWords(count, "medium", actualSeed)
      const initialized = initializeWords(rawWords)
      
      if (initialized.length > 0) {
        initialized[0].state = "active"
        if (initialized[0].letters.length > 0) {
          initialized[0].letters[0].state = "active"
        }
      }

      useTypingStore.setState({
        config: roomMode === "words"
          ? { mode: "battle", wordCount: roomValue as WordCount }
          : { mode: "battle", duration: roomValue as TimeDuration },
        status: "ready",
        words: initialized,
        currentWordIndex: 0,
        currentLetterIndex: 0,
        startTime: null,
        endTime: null,
        timeRemaining: roomMode === "timed" ? roomValue : null,
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        incorrectKeystrokes: 0,
        keystrokes: [],
      })

      useBattleStore.setState({
        config: {
          difficulty: "medium",
          aiWpm: 60,
          wordCount: count as any,
        },
        status: "racing",
        aiProgress: 0,
        playerProgress: 0,
        winner: null,
      })
    }
  }, [activeRoomSeed])

  // 2. Synchronize opponent's caret progress
  useEffect(() => {
    useBattleStore.setState({ aiProgress: opponentProgress })
  }, [opponentProgress])

  // 3. Track and emit progress to WebSocket
  useEffect(() => {
    if (
      (activeRoomStatus === "active" || activeRoomStatus === "disconnected") &&
      activeRoomId &&
      words.length > 0
    ) {
      const totalLetters = words.reduce((sum, w) => sum + w.text.length + 1, 0)
      const completedLetters =
        words.slice(0, currentWordIndex).reduce((sum, w) => sum + w.text.length + 1, 0) +
        currentLetterIndex
      const progress = Math.min(completedLetters / totalLetters, 1.0)

      sendProgress(activeRoomId, progress)
      useBattleStore.setState({ playerProgress: progress })
    }
  }, [currentWordIndex, currentLetterIndex, activeRoomStatus, activeRoomId, words, sendProgress])

  // 4. Handle run completion
  useEffect(() => {
    if (typingStatus === "finished" && activeRoomStatus === "active" && activeRoomId) {
      const s = useTypingStore.getState()
      const totalCorrect = s.words.reduce((sum, w) => {
        return sum + w.letters.filter((l) => l.state === "correct").length
      }, 0)
      const elapsed = Date.now() - (s.startTime || Date.now())
      const finalWpm = Math.round((totalCorrect / 5) / (elapsed / 60000))
      const finalAcc = Math.round((s.correctKeystrokes / (s.totalKeystrokes || 1)) * 100)

      sendFinish(activeRoomId, finalWpm, finalAcc)
    }
  }, [typingStatus, activeRoomStatus, activeRoomId, sendFinish])

  // Call countdown hook for multiplayer timed mode
  useCountdown(
    activeRoomMode === "timed" ? (activeRoomValue ?? 30) : 30,
    () => {
      if (typingStatus === "running") {
        useTypingStore.getState().finishSession()
      }
    },
    typingStatus === "running" && activeRoomMode === "timed"
  )

  // Cleanup multiplayer on unmount (Disabled to prevent dev-mode double-mount from resetting active battle)
  useEffect(() => {
    return () => {}
  }, [])

  // Render Loader if joining/waiting
  if (!activeRoomId) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center font-sans">
        <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold text-text-secondary">Joining Battle Room...</span>
      </div>
    )
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center font-sans select-none relative py-6">
      
      {/* 3-2-1 Countdown screen */}
      {activeRoomStatus === "countdown" && countdownRemaining !== null && (
        <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm z-[80] flex flex-col items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Battle starts in</span>
            <span className="text-8xl font-bold text-accent animate-pulse font-sans tabular-nums">
              {countdownRemaining}
            </span>
          </div>
        </div>
      )}

      {/* Disconnected state alert overlay */}
      {activeRoomStatus === "disconnected" && (
        <div className="w-full max-w-2xl bg-[#ff9500]/10 border border-[#ff9500]/30 rounded-xl p-3 px-4 mb-4 flex items-center justify-center gap-2 animate-pulse text-[#ff9500]">
          <span className="w-2 h-2 rounded-full bg-[#ff9500]" />
          <span className="text-xs font-bold uppercase tracking-wider">Opponent disconnected! Waiting up to 30s for reconnection...</span>
        </div>
      )}

      {/* Waiting for opponent banner */}
      {waitingForOpponent && (activeRoomStatus === "active" || activeRoomStatus === "disconnected") && (
        <div className="w-full max-w-2xl bg-surface-secondary/50 border border-border/10 rounded-xl p-3 px-4 mb-4 flex items-center justify-center gap-3 animate-pulse text-text-secondary">
          <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Completed! Waiting for opponent to finish...
          </span>
        </div>
      )}

      {/* Active Battle Board */}
      {(activeRoomStatus === "active" || activeRoomStatus === "disconnected" || activeRoomStatus === "countdown") && (
        <div className="w-full max-w-5xl flex flex-col">
          {/* Room details */}
          <div className="flex justify-between items-center px-4 mb-4 select-none">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Active Match</span>
              <span className="text-sm font-semibold text-text-primary mt-0.5">Vs @{opponent?.username || "Friend"}</span>
            </div>
            <span className="text-[10px] font-mono bg-surface-secondary/40 border border-border/10 rounded px-2 py-0.5 text-text-tertiary">
              ROOM: {activeRoomId.substring(0, 8)}
            </span>
          </div>

          <WhiteCard className="py-6 px-8 relative">
            {/* The shared Typing Area */}
            <TypingArea />

            {/* Live stats */}
            {(typingStatus === "running" || (typingStatus === "finished" && waitingForOpponent)) && (
              <div className="mt-4">
                <StatsBar wpm={wpm} accuracy={accuracy} time={null} mode="battle" />
              </div>
            )}
          </WhiteCard>
        </div>
      )}

      {/* Finished / Abandoned stats overview */}
      {(activeRoomStatus === "finished" || activeRoomStatus === "abandoned") && battleResult && (() => {
        const typingStoreState = useTypingStore.getState()
        const duration = Math.max(1, ((typingStoreState.endTime || Date.now()) - (typingStoreState.startTime || Date.now())) / 1000)
        
        const { timeline, errorKeys } = computeSessionTimelineAndErrors(
          typingStoreState.keystrokes,
          typingStoreState.startTime || Date.now(),
          duration
        )

        const myWpm = isPlayerOne ? battleResult.playerOneWpm : battleResult.playerTwoWpm
        const myAcc = isPlayerOne ? battleResult.playerOneAcc : battleResult.playerTwoAcc
        
        const finalResult: SessionResult = {
          id: activeRoomId,
          timestamp: Date.now(),
          config: { mode: "battle" },
          wpm: myWpm,
          accuracy: myAcc,
          totalKeystrokes: typingStoreState.totalKeystrokes || typingStoreState.correctKeystrokes + typingStoreState.incorrectKeystrokes,
          correctKeystrokes: typingStoreState.correctKeystrokes,
          incorrectKeystrokes: typingStoreState.incorrectKeystrokes,
          duration,
          wordsCompleted: typingStoreState.currentWordIndex,
          timeline,
          errorKeys,
        }

        const oppUsername = opponent?.username || "opponent"
        const oppWpm = isPlayerOne ? battleResult.playerTwoWpm : battleResult.playerOneWpm
        const oppAcc = isPlayerOne ? battleResult.playerTwoAcc : battleResult.playerOneAcc

        return (
          <MultiplayerResultsCard
            result={finalResult}
            opponentUsername={oppUsername}
            opponentWpm={oppWpm}
            opponentAcc={oppAcc}
            winnerId={battleResult.winnerId}
            currentUserId={currentUserId}
            activeRoomStatus={activeRoomStatus}
            onClose={() => {
              if (activeRoomId) {
                leaveRoom(activeRoomId)
              }
              router.push("/friends")
            }}
          />
        )
      })()}
    </div>
  )
}
