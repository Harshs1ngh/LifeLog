const REFLECTION_KEYWORDS = ["because", "reason", "learned", "realized", "next time", "why", "therefore", "understood", "noticed", "i think"];
const EMOTION_POSITIVE = ["happy", "joy", "excited", "proud", "grateful", "calm", "loved", "hopeful", "content", "fulfilled"];
const EMOTION_NEGATIVE = ["sad", "angry", "stressed", "anxious", "frustrated", "lonely", "hurt", "scared", "upset", "depressed"];

export function scoreEntry(text, previousTexts = []) {
  if (!text || typeof text !== "string") return 0;

  const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Hard rule
  if (wordCount < 8) return 0;

  // ── Depth Score ──────────────────────────────────────────
  let depthScore = 0;
  if (wordCount >= 10 && wordCount <= 30) depthScore = 5;
  else if (wordCount > 30 && wordCount <= 60) depthScore = 8;
  else if (wordCount > 60) depthScore = 10;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 4);
  if (sentences.length >= 3) depthScore += 2;

  // ── Emotion Score ─────────────────────────────────────────
  const lowerText = text.toLowerCase();
  const posHits = EMOTION_POSITIVE.filter(w => lowerText.includes(w)).length;
  const negHits = EMOTION_NEGATIVE.filter(w => lowerText.includes(w)).length;
  let emotionScore = 0;
  if (posHits === 0 && negHits === 0) emotionScore = 1;
  else if (posHits > 0 && negHits > 0) emotionScore = 5; // mixed
  else emotionScore = 3; // one-sided

  // ── Reflection Score ──────────────────────────────────────
  const reflectionHits = REFLECTION_KEYWORDS.filter(kw => lowerText.includes(kw)).length;
  let reflectionScore = 0;
  if (reflectionHits === 1) reflectionScore = 3;
  else if (reflectionHits >= 2) reflectionScore = 5;

  // ── Repetition Penalty ────────────────────────────────────
  let penalty = 0;
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / wordCount;
  if (uniqueRatio < 0.4) penalty += 3;  // low variety
  if (uniqueRatio < 0.25) penalty += 2; // extra penalty

  // Copy-paste: check against previous entries
  if (previousTexts.length > 0) {
    for (const prev of previousTexts) {
      const prevWords = prev.toLowerCase().split(/\s+/).filter(Boolean);
      const prevSet = new Set(prevWords);
      const overlap = words.filter(w => prevSet.has(w)).length;
      const overlapRatio = overlap / wordCount;
      if (overlapRatio > 0.8) { return 0; } // copy-paste → 0
      if (overlapRatio > 0.6) penalty += 5; // very similar
    }
  }

  const total = depthScore + emotionScore + reflectionScore - penalty;
  return Math.max(0, total);
}