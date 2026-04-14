import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  totalPoints: { type: Number, default: 0 },
  dailyPoints: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastEntryDate: { type: String, default: null }, // "YYYY-MM-DD"
}, { timestamps: true });

userSchema.index({ totalPoints: -1 }); // for leaderboard sorting
export default mongoose.model("User", userSchema);
