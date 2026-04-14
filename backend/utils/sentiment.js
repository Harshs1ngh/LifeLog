import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Sentiment = require("sentiment");

const analyzer = new Sentiment();

export function moodOf(text) {
  if (!text || !text.trim()) return "Neutral";

  const result = analyzer.analyze(text);
  const comparative = result.comparative;
  const words = result.words; // matched positive/negative words

  // Detect specific emotions from keywords first
  const t = text.toLowerCase();

  if (/anxious|anxiety|nervous|panic|scared|afraid|fear/.test(t)) return "Anxious";
  if (/angry|furious|rage|hate|annoyed|irritated/.test(t))        return "Angry";
  if (/overwhelmed|exhausted|drained|burnout/.test(t))            return "Overwhelmed";
  if (/grateful|thankful|blessed|appreciate/.test(t))             return "Grateful";
  if (/motivated|inspired|focused|productive|determined/.test(t)) return "Motivated";
  if (/calm|peaceful|serene|relaxed|tranquil/.test(t))            return "Calm";
  if (/frustrated|stuck|annoyed|disappointed/.test(t))            return "Frustrated";
  if (/lonely|alone|isolated|abandoned/.test(t))                  return "Sad";
  if (/argument|fight|conflict|wrong|regret/.test(t))             return "Frustrated";

  // Fall back to sentiment score for general mood
  if (comparative >= 1.5)  return "Excited";
  if (comparative >= 0.5)  return "Happy";
  if (comparative >= 0.1)  return "Content";
  if (comparative > -0.1)  return "Neutral";
  if (comparative >= -0.5) return "Anxious";
  if (comparative >= -1.0) return "Frustrated";
  if (comparative >= -1.5) return "Sad";
  return "Overwhelmed";
}