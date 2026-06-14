/**
 * Generate a substitution cipher map.
 * Each letter a-z maps to a different letter a-z.
 * The mapping must be bijective (one-to-one).
 * Generate once per session and reuse.
 */
export function generateCipherMap(): Record<string, string> {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("")
  let shuffled = [...alphabet]
  
  // Shuffle and try to avoid self-mapping for better cipher effect
  let attempts = 0
  while (attempts < 100) {
    shuffled.sort(() => Math.random() - 0.5)
    let collision = false
    for (let i = 0; i < alphabet.length; i++) {
      if (alphabet[i] === shuffled[i]) {
        collision = true
        break
      }
    }
    if (!collision) break
    attempts++
  }

  const map: Record<string, string> = {}
  for (let i = 0; i < alphabet.length; i++) {
    map[alphabet[i]] = shuffled[i]
  }
  return map
}

/**
 * Encrypt a single character.
 * Handles casing preservation if uppercase characters pass through.
 */
export function encryptChar(char: string, cipherMap: Record<string, string>): string {
  const lower = char.toLowerCase()
  if (cipherMap[lower]) {
    const isUpper = char !== lower
    const mapped = cipherMap[lower]
    return isUpper ? mapped.toUpperCase() : mapped
  }
  return char
}

/**
 * Encrypt a single word using the cipher map.
 * Non-letter characters (spaces, punctuation) stay unchanged.
 */
export function encryptWord(word: string, cipherMap: Record<string, string>): string {
  return word
    .split("")
    .map((char) => encryptChar(char, cipherMap))
    .join("")
}
