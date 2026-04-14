import mongoose from "mongoose";

const entrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: String,
  mood: String,
  images: [String],
  audio: String,
  dateOnly: String,
}, { timestamps: true });

entrySchema.index({ userId: 1, createdAt: -1 });
entrySchema.index({ userId: 1, dateOnly: 1 });
export default mongoose.model("Entry", entrySchema);
