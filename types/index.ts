// ===== LETTER =====
export type LetterState = "pending" | "active" | "correct" | "incorrect" | "extra"

export interface LetterData {
  /** The actual character to type */
  char: string
  /** The encrypted/cipher version of this character (for display before decoding) */
  cipherChar: string
  /** Current state of this letter */
  state: LetterState
  /** Index of this letter within its parent word */
  indexInWord: number
}

// ===== WORD =====
export type WordState = "untouched" | "active" | "completed" | "incorrect"

export interface WordData {
  /** The full word string */
  text: string
  /** Array of letter data for each character */
  letters: LetterData[]
  /** Current state of this word */
  state: WordState
  /** Index of this word in the full text */
  index: number
  /** Any extra characters the user typed beyond the word length */
  extras: LetterData[]
}

// ===== SESSION =====
export type SessionMode = "words" | "timed" | "battle" | "drill" | "yolo"
export type WordCount = 25 | 50 | 75
export type TimeDuration = 60 | 180 | 300

export interface SessionConfig {
  mode: SessionMode
  wordCount?: WordCount        // only if mode === "words" or "battle"
  duration?: TimeDuration      // only if mode === "timed"
  difficulty?: BattleDifficulty | "custom" // only if mode === "battle" or "drill"
  targetKeys?: string[]        // only if mode === "drill"
  targetBigrams?: string[]     // only if mode === "drill"
  targetTrigrams?: string[]    // only if mode === "drill"
  targetWpm?: number           // only if mode === "drill" (custom builder)
  targetDuration?: number      // only if mode === "drill" (custom builder, in seconds)
}

export type SessionStatus = "idle" | "ready" | "running" | "finished"

// ===== DRILL STATS =====
export interface YoloLetterProfile {
  letter: string
  attempts: number
  correct: number
  avgReactionMs: number
  confidence: number
}

export interface KeyStats {
  key: string
  totalAttempts: number
  totalCorrect: number
  totalIncorrect: number
  totalReactionTime: number
  averageReactionTime: number
  maxConsecutiveMistakes: number
}

export interface BigramStats {
  pair: string
  attempts: number
  mistakes: number
  averageTransitionTime: number
}

export interface TrigramStats {
  sequence: string
  attempts: number
  mistakes: number
  averageTransitionTime: number
}

export interface MistakeRecord {
  expected: string
  actual: string
  timestamp: number
}

export interface DrillHistoryEntry {
  id: string
  timestamp: number
  difficulty: "easy" | "medium" | "hard" | "custom"
  beforeAccuracy: number
  afterAccuracy: number
  improvement: number
  reactionTimeImprovement: number
  weakKeysImproved: string[]
}

export interface SessionState {
  config: SessionConfig
  status: SessionStatus
  words: WordData[]
  currentWordIndex: number
  currentLetterIndex: number
  startTime: number | null     // Date.now() when first key pressed
  endTime: number | null       // Date.now() when session ends
  timeRemaining: number | null // seconds, only for timed mode
  totalKeystrokes: number
  correctKeystrokes: number
  incorrectKeystrokes: number
}

// ===== STATS =====
export interface SessionResult {
  id: string                   // crypto.randomUUID()
  timestamp: number            // Date.now()
  config: SessionConfig
  wpm: number
  accuracy: number             // 0 to 100
  totalKeystrokes: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  duration: number             // actual seconds taken
  wordsCompleted: number
}

export interface StatsState {
  history: SessionResult[]     // last 50 sessions
  bestWpm: number
  averageWpm: number
  averageAccuracy: number
}

// ===== BATTLE =====
export type BattleDifficulty = "easy" | "medium" | "hard"

export interface BattleConfig {
  difficulty: BattleDifficulty
  aiWpm: number                // derived from difficulty
  wordCount: WordCount
}

export type BattleStatus = "selecting" | "racing" | "finished"

export interface BattleState {
  config: BattleConfig
  status: BattleStatus
  playerProgress: number       // 0 to 1 (percentage of words completed)
  aiProgress: number           // 0 to 1
  winner: "player" | "ai" | null
}

// ===== THEME =====
export type Theme = "light" | "dark"

// ===== CARET =====
export interface CaretPosition {
  top: number     // px from top of typing area
  left: number    // px from left of typing area
  height: number  // height of the caret line
}
