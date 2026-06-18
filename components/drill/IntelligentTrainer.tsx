"use client"

import { useMemo } from "react"
import { useDrillStore } from "@/stores/drill-store"
import { useStatsStore } from "@/stores/stats-store"
import { useTypingStore } from "@/stores/typing-store"
import { calculateKeyWeakness, calculateBigramWeakness } from "@/engine/drill-engine"
import { playClickSound } from "@/lib/audio"
import WhiteCard from "@/components/ui/WhiteCard"

interface IntelligentTrainerProps {
  onStartDrill: () => void
}

export default function IntelligentTrainer({ onStartDrill }: IntelligentTrainerProps) {
  // Selective store subscriptions to optimize re-renders
  const keyStats = useDrillStore((s) => s.keyStats)
  const bigramStats = useDrillStore((s) => s.bigramStats)
  const mistakeRecords = useDrillStore((s) => s.mistakeRecords)

  const averageWpm = useStatsStore((s) => s.averageWpm)
  const averageAccuracy = useStatsStore((s) => s.averageAccuracy)
  const history = useStatsStore((s) => s.history)
  const initSession = useTypingStore((s) => s.initSession)

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }, [])

  // Expanded Rank progression ladder (Novice -> Legend)
  const rankInfo = useMemo(() => {
    const wpm = averageWpm
    if (wpm === 0) {
      return { rank: "Novice", nextRank: "Apprentice", progressPercent: 0 }
    }

    const ladder = [
      { name: "Novice", min: 0, max: 20 },
      { name: "Apprentice", min: 20, max: 35 },
      { name: "Intermediate", min: 35, max: 50 },
      { name: "Advanced", min: 50, max: 65 },
      { name: "Expert", min: 65, max: 80 },
      { name: "Master", min: 80, max: 95 },
      { name: "Elite", min: 95, max: 110 },
      { name: "Grandmaster", min: 110, max: 125 },
      { name: "Legend", min: 125, max: 999 },
    ]

    const idx = ladder.findIndex((r) => wpm >= r.min && wpm < r.max)
    const current = ladder[idx >= 0 ? idx : ladder.length - 1]
    const next = ladder[idx + 1 < ladder.length ? idx + 1 : idx]

    const range = current.max - current.min
    const progress = range > 0 ? Math.round(((wpm - current.min) / range) * 100) : 100

    return {
      rank: current.name,
      nextRank: next.name,
      progressPercent: Math.min(100, Math.max(0, progress)),
    }
  }, [averageWpm])


  // Derive target items metrics
  const statsSummary = useMemo(() => {
    const totalIncorrectAllKeys = Object.values(keyStats).reduce(
      (sum, s) => sum + s.totalIncorrect,
      0
    )

    // 1. Worst Key
    const worstKeyObj = Object.values(keyStats)
      .filter((s) => s.totalAttempts > 0)
      .map((s) => ({
        key: s.key,
        accuracy: Math.round((s.totalCorrect / s.totalAttempts) * 100),
        weakness: calculateKeyWeakness(s, totalIncorrectAllKeys),
      }))
      .sort((a, b) => b.weakness - a.weakness)[0]

    // 2. Worst Transition (Bigram)
    const worstTransitionObj = Object.values(bigramStats)
      .filter((s) => s.attempts > 0)
      .map((s) => ({
        pair: s.pair,
        speed: s.averageTransitionTime,
        weakness: calculateBigramWeakness(s),
      }))
      .sort((a, b) => b.weakness - a.weakness)[0]

    // 3. Worst Common Mistake
    const mistakeCounts: Record<string, { expected: string; actual: string; count: number }> = {}
    mistakeRecords.forEach((m) => {
      const key = `${m.expected}->${m.actual}`
      if (!mistakeCounts[key]) {
        mistakeCounts[key] = { expected: m.expected, actual: m.actual, count: 0 }
      }
      mistakeCounts[key].count++
    })
    const worstMistakeObj = Object.values(mistakeCounts)
      .sort((a, b) => b.count - a.count)[0]

    return {
      worstKey: worstKeyObj ? worstKeyObj.key.toUpperCase() : "P",
      worstKeyAcc: worstKeyObj ? worstKeyObj.accuracy : 81,
      worstKeyHasData: !!worstKeyObj,
      worstTransition: worstTransitionObj ? worstTransitionObj.pair.toUpperCase() : "TH",
      worstTransitionSpeed: worstTransitionObj ? worstTransitionObj.speed : 340,
      worstTransitionHasData: !!worstTransitionObj,
      commonMistakeExpected: worstMistakeObj ? worstMistakeObj.expected : "e",
      commonMistakeActual: worstMistakeObj ? worstMistakeObj.actual : "r",
      commonMistakeCount: worstMistakeObj ? worstMistakeObj.count : 12,
      commonMistakeHasData: !!worstMistakeObj,
    }
  }, [keyStats, bigramStats, mistakeRecords])

  const handleStartDrill = (type: "precision" | "transition" | "correction") => {
    playClickSound("click")
    if (type === "precision") {
      initSession({
        mode: "drill",
        difficulty: "easy",
        targetKeys: [statsSummary.worstKey.toLowerCase()],
        targetBigrams: [],
      })
    } else if (type === "transition") {
      initSession({
        mode: "drill",
        difficulty: "medium",
        targetKeys: [],
        targetBigrams: [statsSummary.worstTransition.toLowerCase()],
      })
    } else {
      initSession({
        mode: "drill",
        difficulty: "medium",
        targetKeys: [statsSummary.commonMistakeExpected.toLowerCase(), statsSummary.commonMistakeActual.toLowerCase()],
        targetBigrams: [statsSummary.commonMistakeExpected.toLowerCase() + statsSummary.commonMistakeActual.toLowerCase()],
      })
    }
    onStartDrill()
  }

  const hasAnyData = statsSummary.worstKeyHasData || statsSummary.worstTransitionHasData || statsSummary.commonMistakeHasData

  return (
    <div className="space-y-8 py-2 font-sans select-none">
      {/* Screen 1: Drill Profile */}
      <div className="space-y-6">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">
            Drill Profile
          </span>
          <h2 className="text-[32px] font-bold text-text-primary leading-tight tracking-tight mt-1">
            {greeting}
          </h2>
        </div>

        {/* Apple Rank Badge Container - spacious, high-contrast text */}
        <div className="bg-surface-secondary/40 border border-border/10 rounded-[28px] p-8">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
              Typing Intelligence
            </span>
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-bold text-[#007aff] dark:text-[#0a84ff] tracking-tight leading-none">
                  {rankInfo.rank}
                </span>
                <span className="text-base font-bold text-text-secondary tabular-nums">
                  {averageWpm} WPM Avg
                </span>
              </div>
              {averageWpm > 0 && (
                <p className="text-[13px] text-text-secondary">
                  Next Rank: <span className="font-semibold text-text-primary">{rankInfo.nextRank}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Screen 2: Recommended Training */}
      <div className="space-y-4 pt-2">
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">
            Today's Focus
          </span>
          {!hasAnyData && (
            <p className="text-xs text-text-secondary mt-1">
              Start drills below using baseline recommendations. Complete typing sessions to calibrate profiles.
            </p>
          )}
        </div>

        {/* Stacked iOS-style fitness list */}
        <div className="bg-surface-secondary/40 border border-border/10 rounded-[24px] p-6">
          <WhiteCard>
            {/* Card 1: Precision */}
            <div className="flex items-center justify-between py-4 px-1">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Precision
                </span>
                <h4 className="text-[15px] font-bold text-text-primary">
                  Focus Key: <span className="font-mono text-accent">{statsSummary.worstKey}</span>
                </h4>
                <p className="text-[12px] text-text-secondary">
                  Accuracy: <span className="font-semibold text-text-primary tabular-nums">{statsSummary.worstKeyAcc}%</span>
                </p>
              </div>
              <button
                onClick={() => handleStartDrill("precision")}
                className="h-8 px-5 rounded-full bg-accent hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer active:scale-[0.97] select-none"
              >
                Start Drill
              </button>
            </div>

            {/* Card 2: Transitions */}
            <div className="flex items-center justify-between py-4 px-1">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Transitions
                </span>
                <h4 className="text-[15px] font-bold text-text-primary">
                  Focus: {statsSummary.worstTransition} Transition
                </h4>
                <p className="text-[12px] text-text-secondary">
                  Speed: <span className="font-semibold text-text-primary tabular-nums">{statsSummary.worstTransitionSpeed}ms</span> &rarr; Target 250ms
                </p>
              </div>
              <button
                onClick={() => handleStartDrill("transition")}
                className="h-8 px-5 rounded-full bg-accent hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer active:scale-[0.97] select-none"
              >
                Start Drill
              </button>
            </div>

            {/* Card 3: Correction */}
            <div className="flex items-center justify-between py-4 px-1">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Correction
                </span>
                <h4 className="text-[15px] font-bold text-text-primary">
                  Focus Error: <span className="font-mono text-accent">{statsSummary.commonMistakeExpected} &rarr; {statsSummary.commonMistakeActual}</span>
                </h4>
                <p className="text-[12px] text-text-secondary">
                  Logged: <span className="font-semibold text-text-primary tabular-nums">{statsSummary.commonMistakeCount} times</span>
                </p>
              </div>
              <button
                onClick={() => handleStartDrill("correction")}
                className="h-8 px-5 rounded-full bg-accent hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer active:scale-[0.97] select-none"
              >
                Start Drill
              </button>
            </div>
          </WhiteCard>
        </div>
      </div>
    </div>
  )
}
