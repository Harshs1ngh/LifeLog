import express from "express";
import { analyzeEntry, saveEntry, getEntries, lifeCard } from "../controllers/entryController.js";
import { protect } from "../middleware/auth.js";
import { uploadImage, uploadAudio } from "../middleware/upload.js";

const router = express.Router();

router.post("/analyze", analyzeEntry);
router.get("/", protect, getEntries);
router.post("/save", protect, saveEntry);
router.get("/life-card", protect, lifeCard);

router.post("/upload/image", protect, uploadImage.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ path: `/uploads/images/${req.file.filename}` });
});

router.post("/upload/audio", protect, uploadAudio.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ path: `/uploads/audio/${req.file.filename}` });
});

export default router;