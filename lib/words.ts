/**
 * Word bank — 300+ common English words.
 * Mix of 3-8 letter words. No obscure words.
 * Sorted alphabetically for readability.
 */
export const WORD_BANK: string[] = [
  "about", "above", "after", "again", "air", "all", "along", "also",
  "always", "an", "and", "another", "answer", "any", "are", "around",
  "ask", "at", "away", "back", "be", "because", "been", "before",
  "began", "below", "between", "big", "book", "both", "boy", "build",
  "but", "by", "call", "came", "can", "car", "care", "carry", "change",
  "children", "city", "close", "cold", "come", "could", "country",
  "cut", "day", "did", "different", "do", "does", "done", "door",
  "down", "draw", "each", "earth", "eat", "end", "enough", "even",
  "every", "example", "eye", "face", "family", "far", "father",
  "feel", "few", "find", "first", "follow", "food", "for", "form",
  "found", "four", "from", "get", "girl", "give", "go", "going",
  "good", "got", "great", "group", "grow", "had", "hand", "hard",
  "has", "have", "he", "head", "hear", "help", "her", "here", "high",
  "him", "his", "home", "hot", "house", "how", "idea", "if",
  "important", "in", "into", "is", "it", "its", "just", "keep",
  "kind", "know", "land", "large", "last", "later", "learn", "left",
  "let", "letter", "life", "light", "like", "line", "list", "little",
  "live", "long", "look", "made", "make", "man", "many", "may", "me",
  "might", "mile", "mind", "miss", "more", "most", "mother", "move",
  "much", "must", "my", "name", "near", "need", "never", "new",
  "next", "night", "no", "not", "now", "number", "of", "off",
  "often", "old", "on", "once", "one", "only", "open", "or", "other",
  "our", "out", "over", "own", "page", "paper", "part", "people",
  "place", "plant", "play", "point", "put", "question", "quick",
  "quite", "read", "real", "right", "river", "run", "said", "same",
  "saw", "say", "school", "second", "see", "seem", "self", "set",
  "she", "should", "show", "side", "small", "so", "some", "song",
  "soon", "sound", "spell", "start", "state", "still", "stop",
  "story", "study", "such", "sun", "sure", "take", "talk", "tell",
  "than", "that", "the", "their", "them", "then", "there", "these",
  "they", "thing", "think", "this", "those", "thought", "three",
  "through", "time", "to", "together", "too", "tree", "try", "turn",
  "two", "under", "up", "us", "use", "very", "walk", "want", "was",
  "watch", "water", "way", "we", "well", "went", "were", "what",
  "when", "where", "which", "while", "white", "who", "why", "will",
  "with", "without", "word", "work", "world", "would", "write",
  "year", "you", "young", "your",
]

/** Pick N random words from the word bank */
export function getRandomWords(count: number): string[] {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
