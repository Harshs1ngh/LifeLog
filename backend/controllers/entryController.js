import Entry from "../models/Entry.js";
import { moodOf } from "../utils/sentiment.js";
import { scoreEntry } from "../utils/scoreEntry.js";
import User from "../models/User.js";

// Analyze text mood (no save)
export const analyzeEntry = (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Text is required" });
  const mood = moodOf(text);
  res.json({ mood });
};

export const saveEntry = async (req, res) => {
  try {
    const { text, images, audio, dateOnly } = req.body;
 // ── Duplicate guard ──────────────────────────────
    const existing = await Entry.findOne({
      userId: req.user.id,
      text: text?.trim(),
      dateOnly: dateOnly || new Date().toISOString().split("T")[0],
    });
    if (existing) return res.json(existing);
    
    const mood = moodOf(text || "");

    const entry = await Entry.create({
      userId: req.user.id,
      text,
      mood,
      images: images || [],
      audio: audio || null,
      dateOnly: dateOnly || new Date().toISOString().split("T")[0],
    });

    // ── Points logic ──────────────────────────────────
    const user = await User.findById(req.user.id);
    const recentEntries = await Entry.find({ userId: req.user.id })
      .sort({ createdAt: -1 }).limit(5).select("text");
    const previousTexts = recentEntries.map(e => e.text);
    const points = scoreEntry(text, previousTexts);

    const todayIso = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let streakBonus = 2;
    if (user.lastEntryDate === yesterday) {
      user.streak = (user.streak || 0) + 1;
    } else if (user.lastEntryDate !== todayIso) {
      user.streak = 1;
    }
    if (user.streak >= 7) streakBonus += 10;
    else if (user.streak >= 3) streakBonus += 5;

    user.dailyPoints = (user.dailyPoints || 0) + points + streakBonus;
    user.lastEntryDate = todayIso;
    await user.save();
    // ─────────────────────────────────────────────────

    res.json(entry);
  } catch (err) {
    console.error("saveEntry error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all entries for the logged-in user
export const getEntries = async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Life card summary for the logged-in user
export const lifeCard = async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id });
    const total = entries.length;
    if (!total) return res.json({ summary: "No entries yet." });

    const happy = entries.filter(e => e.mood === "Happy").length;
    const sad = entries.filter(e => e.mood === "Sad").length;
    const neutral = total - happy - sad;

    res.json({
      total_entries: total,
      happy,
      sad,
      neutral,
      summary: `Across ${total} entries — ${happy} happy, ${sad} sad, ${neutral} neutral.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
