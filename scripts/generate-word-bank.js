const https = require("https");
const fs = require("fs");
const path = require("path");

const SOURCE_URL = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt";
const WORDS_DIR = path.join(__dirname, "..", "lib", "words");
const INDEXES_DIR = path.join(WORDS_DIR, "indexes");

// Ensure directories exist
if (!fs.existsSync(WORDS_DIR)) {
  fs.mkdirSync(WORDS_DIR, { recursive: true });
}
if (!fs.existsSync(INDEXES_DIR)) {
  fs.mkdirSync(INDEXES_DIR, { recursive: true });
}

console.log("Fetching Google 10k Word list (no swears)...");
https.get(SOURCE_URL, (res) => {
  let rawData = "";
  res.on("data", (chunk) => { rawData += chunk; });
  res.on("end", () => {
    try {
      processWords(rawData);
    } catch (err) {
      console.error("Failed to process word list:", err);
      process.exit(1);
    }
  });
}).on("error", (err) => {
  console.error("HTTP Fetch failed:", err);
  process.exit(1);
});

function processWords(rawData) {
  const lines = rawData.split(/\r?\n/);
  const seen = new Set();
  const cleanWords = [];

  // Filter 1: Lowercase a-z only, length 2-15, deduplicated
  for (let rank = 0; rank < lines.length; rank++) {
    const word = lines[rank].trim().toLowerCase();
    if (!word) continue;

    // Must be strictly lowercase a-z letters, 2 to 15 chars
    if (/^[a-z]{2,15}$/.test(word)) {
      if (!seen.has(word)) {
        seen.add(word);
        cleanWords.push(word);
      }
    }
  }

  console.log(`Sanitized word pool size: ${cleanWords.length} words.`);

  // Segment by difficulty based on length and frequency rank
  // Since cleanWords retains the original frequency order:
  const easyIndices = [];
  const mediumIndices = [];
  const hardIndices = [];

  cleanWords.forEach((word, index) => {
    // Easy: high frequency (rank < 2500 in clean list) and short length (2-5 letters)
    if (index < 2500 && word.length >= 2 && word.length <= 5) {
      easyIndices.push(index);
    }
    // Medium: medium frequency (rank < 6500) and medium length (4-8 letters)
    else if (index < 6500 && word.length >= 4 && word.length <= 8) {
      mediumIndices.push(index);
    }
    // Hard: low frequency or long words
    else {
      hardIndices.push(index);
    }
  });

  console.log(`Tiers computed - Easy: ${easyIndices.length}, Medium: ${mediumIndices.length}, Hard: ${hardIndices.length}`);

  // Build indexes mapping characters, bigrams, and trigrams to index arrays
  const letterMap = {};
  const bigramMap = {};
  const trigramMap = {};

  // Track raw frequencies of bigrams and trigrams for filtering
  const bigramFreq = {};
  const trigramFreq = {};

  cleanWords.forEach((word, index) => {
    // 1. Letters
    const letters = new Set(word.split(""));
    letters.forEach((char) => {
      if (!letterMap[char]) letterMap[char] = [];
      letterMap[char].push(index);
    });

    // 2. Bigrams (adjacent pairs)
    const bigrams = new Set();
    for (let i = 0; i < word.length - 1; i++) {
      bigrams.add(word.substring(i, i + 2));
    }
    bigrams.forEach((bg) => {
      if (!bigramFreq[bg]) bigramFreq[bg] = 0;
      bigramFreq[bg]++;
    });

    // 3. Trigrams (adjacent triplets)
    const trigrams = new Set();
    for (let i = 0; i < word.length - 2; i++) {
      trigrams.add(word.substring(i, i + 3));
    }
    trigrams.forEach((tg) => {
      if (!trigramFreq[tg]) trigramFreq[tg] = 0;
      trigramFreq[tg]++;
    });
  });

  // Re-populate maps with filtered items to avoid memory/file size bloat
  cleanWords.forEach((word, index) => {
    // Bigrams (filter: occurrences in corpus >= 5)
    const bigrams = new Set();
    for (let i = 0; i < word.length - 1; i++) {
      const bg = word.substring(i, i + 2);
      if (bigramFreq[bg] >= 5) {
        bigrams.add(bg);
      }
    }
    bigrams.forEach((bg) => {
      if (!bigramMap[bg]) bigramMap[bg] = [];
      bigramMap[bg].push(index);
    });

    // Trigrams (filter: occurrences in corpus >= 10 as requested)
    const trigrams = new Set();
    for (let i = 0; i < word.length - 2; i++) {
      const tg = word.substring(i, i + 3);
      if (trigramFreq[tg] >= 10) {
        trigrams.add(tg);
      }
    }
    trigrams.forEach((tg) => {
      if (!trigramMap[tg]) trigramMap[tg] = [];
      trigramMap[tg].push(index);
    });
  });

  console.log(`Indexed letters: ${Object.keys(letterMap).length}`);
  console.log(`Indexed bigrams (freq >= 5): ${Object.keys(bigramMap).length}`);
  console.log(`Indexed trigrams (freq >= 10): ${Object.keys(trigramMap).length}`);

  // Write files
  // 1. word-pool.ts
  fs.writeFileSync(
    path.join(WORDS_DIR, "word-pool.ts"),
    `export const WORDS: string[] = ${JSON.stringify(cleanWords, null, 2)};\n`
  );

  // 2. easy.ts
  fs.writeFileSync(
    path.join(WORDS_DIR, "easy.ts"),
    `export const EASY_INDICES: number[] = ${JSON.stringify(easyIndices, null, 2)};\n`
  );

  // 3. medium.ts
  fs.writeFileSync(
    path.join(WORDS_DIR, "medium.ts"),
    `export const MEDIUM_INDICES: number[] = ${JSON.stringify(mediumIndices, null, 2)};\n`
  );

  // 4. hard.ts
  fs.writeFileSync(
    path.join(WORDS_DIR, "hard.ts"),
    `export const HARD_INDICES: number[] = ${JSON.stringify(hardIndices, null, 2)};\n`
  );

  // 5. indexes/letter-index.ts
  fs.writeFileSync(
    path.join(INDEXES_DIR, "letter-index.ts"),
    `export const LETTER_INDEX: Record<string, number[]> = ${JSON.stringify(letterMap, null, 2)};\n`
  );

  // 6. indexes/bigram-index.ts
  fs.writeFileSync(
    path.join(INDEXES_DIR, "bigram-index.ts"),
    `export const BIGRAM_INDEX: Record<string, number[]> = ${JSON.stringify(bigramMap, null, 2)};\n`
  );

  // 7. indexes/trigram-index.ts
  fs.writeFileSync(
    path.join(INDEXES_DIR, "trigram-index.ts"),
    `export const TRIGRAM_INDEX: Record<string, number[]> = ${JSON.stringify(trigramMap, null, 2)};\n`
  );

  console.log("All build-time vocabulary assets generated successfully!");
}
