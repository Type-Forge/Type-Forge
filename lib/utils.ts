/** Calculate WPM: (correct characters / 5) / minutes elapsed */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  return Math.round((correctChars / 5) / minutes)
}

/** Calculate accuracy: (correct / total) * 100 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100
  return Math.round((correct / total) * 100)
}

/** Format seconds to MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

/** Generate a unique ID */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(" ")
}

interface KeystrokeInput {
  char: string
  expectedChar: string
  time: number
  isCorrect: boolean
}

export function computeSessionTimelineAndErrors(
  keystrokes: KeystrokeInput[],
  sessionStartTime: number,
  durationSecs: number
) {
  if (keystrokes.length === 0) {
    return { timeline: [], errorKeys: {} }
  }

  // 1. Calculate error keys
  const errorKeys: Record<string, number> = {}
  keystrokes.forEach((k) => {
    if (!k.isCorrect) {
      const exp = k.expectedChar.toLowerCase()
      if (exp && exp.length === 1 && /^[a-z ]$/.test(exp)) {
        errorKeys[exp] = (errorKeys[exp] || 0) + 1
      }
    }
  })

  // 2. Calculate WPM and Accuracy timeline (per second)
  const timeline: { second: number; wpm: number; accuracy: number }[] = []
  
  // Total duration of the session in seconds
  const totalSeconds = Math.max(1, Math.ceil(durationSecs))
  
  for (let s = 1; s <= totalSeconds; s++) {
    const timestampAtSecond = sessionStartTime + s * 1000
    
    // Find all keystrokes typed up to this second
    const keystrokesUpToSecond = keystrokes.filter(k => k.time <= timestampAtSecond)
    
    let correctCount = 0
    let totalCount = keystrokesUpToSecond.length
    
    keystrokesUpToSecond.forEach(k => {
      if (k.isCorrect) {
        correctCount++
      }
    })
    
    // Calculate cumulative WPM at second s:
    // WPM = (correctCount / 5) * (60 / s)
    const cumulativeWpm = Math.round((correctCount / 5) * (60 / s))
    
    // Calculate cumulative accuracy:
    const cumulativeAccuracy = totalCount > 0 
      ? Math.round((correctCount / totalCount) * 100)
      : 100
      
    timeline.push({
      second: s,
      wpm: cumulativeWpm,
      accuracy: cumulativeAccuracy
    })
  }

  return { timeline, errorKeys }
}
