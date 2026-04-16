
import express from "express";
import Leaderboard from "../models/Leaderboard.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const board = await Leaderboard.find()
      .sort({ totalPoints: -1 })
      .limit(50);
    const filtered = board.filter(e => e.totalPoints > 0);
    res.json(filtered);
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// Manual trigger for testing (remove in production)
import { updateLeaderboard } from "../cron/leaderboardCron.js";
router.post("/trigger-update", protect, async (req, res) => {
  try {
    await updateLeaderboard();
    res.json({ message: "Leaderboard updated!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;