import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: String,
  totalPoints: { type: Number, default: 0 },
  rank: Number,
  date: { type: String }, // "YYYY-MM-DD" of last update
});

export default mongoose.model("Leaderboard", leaderboardSchema);