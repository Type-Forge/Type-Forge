import type { WordData, LetterData } from "@/types"
import { generateCipherMap, encryptChar } from "./cipher-engine"
import { MAX_EXTRAS_PER_WORD } from "@/lib/constants"

/**
 * Initialize words array from raw strings.
 * Each word gets letter data with cipher characters.
 * First word is "active", first letter of first word is "active".
 * All others are "untouched"/"pending".
 */
export function initializeWords(rawWords: string[]): WordData[] {
  const cipherMap = generateCipherMap()
  return rawWords.map((wordStr, wordIdx) => {
    const letters: LetterData[] = wordStr.split("").map((char, charIdx) => ({
      char,
      cipherChar: encryptChar(char, cipherMap),
      state: "pending",
      indexInWord: charIdx,
    }))
    return {
      text: wordStr,
      letters,
      state: "untouched",
      index: wordIdx,
      extras: [],
    }
  })
}

/**
 * Process a character keystroke.
 * Compare typed char with expected char at current position.
 * Return updated words array, new letter index, and whether it was correct.
 *
 * Rules:
 * - If currentLetterIndex < word.length: compare with word[currentLetterIndex]
 *   - Match → state = "correct"
 *   - No match → state = "incorrect"
 *   - Advance currentLetterIndex by 1
 * - If currentLetterIndex >= word.length: add to extras array
 *   - Extra letters are always state = "extra"
 *   - Max extras = MAX_EXTRAS_PER_WORD
 */
export function processCharacter(
  words: WordData[],
  wordIndex: number,
  letterIndex: number,
  typedChar: string
): { words: WordData[]; newLetterIndex: number; isCorrect: boolean } {
  // Deep clone words to maintain immutability
  const updatedWords = words.map((w) => ({
    ...w,
    letters: w.letters.map((l) => ({ ...l })),
    extras: w.extras.map((l) => ({ ...l })),
  }))

  const word = updatedWords[wordIndex]
  if (!word) return { words: updatedWords, newLetterIndex: letterIndex, isCorrect: false }

  let isCorrect = false
  let newLetterIndex = letterIndex

  if (letterIndex < word.letters.length) {
    const currentLetter = word.letters[letterIndex]
    isCorrect = currentLetter.char.toLowerCase() === typedChar.toLowerCase()
    
    // Set state of the current letter
    currentLetter.state = isCorrect ? "correct" : "incorrect"
    newLetterIndex = letterIndex + 1

    // Set next letter to active if it exists within normal letters range
    if (newLetterIndex < word.letters.length) {
      word.letters[newLetterIndex].state = "active"
    }
  } else {
    // If it's beyond standard letters, add to extras
    if (word.extras.length < MAX_EXTRAS_PER_WORD) {
      word.extras.push({
        char: typedChar,
        cipherChar: typedChar,
        state: "extra",
        indexInWord: word.letters.length + word.extras.length,
      })
      newLetterIndex = letterIndex + 1
    }
    isCorrect = false // Extra letters are incorrect keystrokes
  }

  return { words: updatedWords, newLetterIndex, isCorrect }
}

/**
 * Process a space keystroke (advance to next word).
 * Mark current word as "completed" (all correct) or "incorrect" (has errors).
 * Mark all remaining pending letters in current word as "incorrect".
 * Set next word as "active" and its first letter as "active".
 * Reset letterIndex to 0.
 *
 * Returns null if no next word (session should end).
 */
export function processSpace(
  words: WordData[],
  wordIndex: number
): { words: WordData[]; newWordIndex: number; newLetterIndex: number } | null {
  const updatedWords = words.map((w) => ({
    ...w,
    letters: w.letters.map((l) => ({ ...l })),
    extras: w.extras.map((l) => ({ ...l })),
  }))

  const currentWord = updatedWords[wordIndex]
  if (!currentWord) return null

  // Check if current word has errors or untyped characters
  let hasErrors = currentWord.extras.length > 0
  currentWord.letters.forEach((letter) => {
    if (letter.state === "pending" || letter.state === "active") {
      letter.state = "incorrect"
      hasErrors = true
    } else if (letter.state === "incorrect") {
      hasErrors = true
    }
  })

  // Mark word state
  currentWord.state = hasErrors ? "incorrect" : "completed"

  const nextWordIndex = wordIndex + 1
  if (nextWordIndex >= updatedWords.length) {
    return null // Session complete
  }

  // Activate next word
  const nextWord = updatedWords[nextWordIndex]
  nextWord.state = "active"
  if (nextWord.letters.length > 0) {
    nextWord.letters[0].state = "active"
  }

  return {
    words: updatedWords,
    newWordIndex: nextWordIndex,
    newLetterIndex: 0,
  }
}

/**
 * Process a backspace keystroke.
 * Rules:
 * - If there are extras: remove last extra, don't change letterIndex
 * - If letterIndex > 0: decrement letterIndex, reset that letter to "pending"
 * - If letterIndex === 0: do nothing (can't go to previous word)
 * - The new current letter position becomes "active"
 */
export function processBackspace(
  words: WordData[],
  wordIndex: number,
  letterIndex: number
): { words: WordData[]; newLetterIndex: number } {
  const updatedWords = words.map((w) => ({
    ...w,
    letters: w.letters.map((l) => ({ ...l })),
    extras: w.extras.map((l) => ({ ...l })),
  }))

  const word = updatedWords[wordIndex]
  if (!word) return { words: updatedWords, newLetterIndex: letterIndex }

  let newLetterIndex = letterIndex

  if (word.extras.length > 0) {
    word.extras.pop()
    newLetterIndex = word.letters.length + word.extras.length
  } else if (letterIndex > 0) {
    // Deactivate currently active letter (if within range) and make it pending
    if (letterIndex < word.letters.length) {
      word.letters[letterIndex].state = "pending"
    }
    
    newLetterIndex = letterIndex - 1
    word.letters[newLetterIndex].state = "active"
  }

  return { words: updatedWords, newLetterIndex }
}

/**
 * Process a word delete keystroke (Ctrl+Backspace / Option+Backspace).
 * Resets the current word's letters to "pending" and clears all extras.
 * Sets the first letter of the current word to "active".
 * Returns updated words array and sets newLetterIndex to 0.
 */
export function processWordDelete(
  words: WordData[],
  wordIndex: number
): { words: WordData[]; newLetterIndex: number } {
  const updatedWords = words.map((w) => ({
    ...w,
    letters: w.letters.map((l) => ({ ...l })),
    extras: w.extras.map((l) => ({ ...l })),
  }))

  const word = updatedWords[wordIndex]
  if (!word) return { words: updatedWords, newLetterIndex: 0 }

  // Reset all letters to pending
  word.letters.forEach((l, idx) => {
    l.state = idx === 0 ? "active" : "pending"
  })

  // Clear extras
  word.extras = []

  return { words: updatedWords, newLetterIndex: 0 }
}


/**
 * Check if all words are completed (for word-count mode end condition).
 */
export function isSessionComplete(words: WordData[], wordIndex: number): boolean {
  if (wordIndex >= words.length - 1) {
    const lastWord = words[words.length - 1]
    const allTyped = lastWord.letters.every(
      (l) => l.state === "correct" || l.state === "incorrect"
    )
    return allTyped
  }
  return false
}

/**
 * Count total correct characters across all completed words.
 * Used for WPM calculation.
 */
export function countCorrectChars(words: WordData[]): number {
  let count = 0
  words.forEach((word) => {
    word.letters.forEach((letter) => {
      if (letter.state === "correct") {
        count++
      }
    })
  })
  return count
}
