import type { BattleDifficulty, WordCount, TimeDuration } from "@/types"

export const WORD_COUNT_OPTIONS: WordCount[] = [15, 25, 50, 75]
export const TIME_DURATION_OPTIONS: TimeDuration[] = [15, 30, 60, 180]

export const AI_WPM_MAP: Record<BattleDifficulty, number> = {
  easy: 35,
  medium: 60,
  hard: 90,
  veryhard: 120,
}

export const BATTLE_COUNTDOWN_SECONDS = 3

export const MAX_HISTORY_LENGTH = 50

/** How many extra characters a user can type beyond a word's length */
export const MAX_EXTRAS_PER_WORD = 8

/** Caret blink interval in ms */
export const CARET_BLINK_INTERVAL = 530
