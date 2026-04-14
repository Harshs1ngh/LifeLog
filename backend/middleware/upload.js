import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const imageDir = path.join(__dirname, "../uploads/images");
const audioDir = path.join(__dirname, "../uploads/audio");
fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, audioDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

// Security: validate file types
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"));
};

const audioFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|ogg|m4a|webm|aac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    return cb(null, true);
  }
  cb(new Error("Only audio files (mp3, wav, ogg, m4a, webm, aac) are allowed"));
};

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});
