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
