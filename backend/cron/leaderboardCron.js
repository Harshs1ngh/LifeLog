import cron from "node-cron";
import User from "../models/User.js";
import Leaderboard from "../models/Leaderboard.js";

export async function updateLeaderboard() {
  try {
    const users = await User.find({});
    for (const user of users) {
      const weeklyScore = (user.totalPoints || 0) + (user.dailyPoints || 0);
      await Leaderboard.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          username: user.name || user.email,
          totalPoints: weeklyScore,
          date: new Date().toISOString().split("T")[0],
        },
        { upsert: true, new: true }
      );
    }
    const allEntries = await Leaderboard.find().sort({ totalPoints: -1 });
    for (let i = 0; i < allEntries.length; i++) {
      allEntries[i].rank = i + 1;
      await allEntries[i].save();
    }
    console.log("[CRON] Leaderboard updated.");
  } catch (err) {
    console.error("[CRON] Leaderboard update failed:", err);
  }
}

export function startLeaderboardCron() {

  // ── Every hour: sync leaderboard display ──────────────────────────
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Hourly leaderboard sync...");
    await updateLeaderboard();
  });

  // ── Midnight Sun–Sat (NOT Monday): flush dailyPoints → totalPoints ─
  // "0 0 * * 0,2-6" = midnight every day EXCEPT Monday
  cron.schedule("0 0 * * 0,2-6", async () => {
    console.log("[CRON] Midnight daily flush...");
    try {
      const users = await User.find({ dailyPoints: { $gt: 0 } });
      for (const user of users) {
        user.totalPoints = (user.totalPoints || 0) + user.dailyPoints;
        user.dailyPoints = 0;
        await user.save();
      }
      await updateLeaderboard();
      console.log("[CRON] Daily flush done.");
    } catch (err) {
      console.error("[CRON] Daily flush failed:", err);
    }
  }, { timezone: "Asia/Kolkata" });

  // ── Monday midnight: flush last day THEN reset weekly ─────────────
  cron.schedule("0 0 * * 1", async () => {
    console.log("[CRON] Monday — flushing last day then resetting week...");
    try {
      // Step 1: flush Sunday's dailyPoints first
      const users = await User.find({ dailyPoints: { $gt: 0 } });
      for (const user of users) {
        user.totalPoints = (user.totalPoints || 0) + user.dailyPoints;
        user.dailyPoints = 0;
        await user.save();
      }

      // Step 2: update leaderboard with final weekly scores
      await updateLeaderboard();

      // Step 3: reset all points for new week
      await User.updateMany({}, { $set: { totalPoints: 0, dailyPoints: 0 } });
      await Leaderboard.updateMany({}, { $set: { totalPoints: 0, rank: 0 } });

      console.log("[CRON] Weekly reset done.");
    } catch (err) {
      console.error("[CRON] Weekly reset failed:", err);
    }
  }, { timezone: "Asia/Kolkata" });

}