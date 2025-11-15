from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json, os, re, shutil
from typing import List

app = FastAPI()

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # (Replace * with your frontend URL after deployment)
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# SAFE BASE PATHS (Railway-safe)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(BASE_DIR, "data", "entries.json")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
UPLOAD_IMAGE_PATH = os.path.join(UPLOAD_DIR, "images")
UPLOAD_AUDIO_PATH = os.path.join(UPLOAD_DIR, "audio")

os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
os.makedirs(UPLOAD_IMAGE_PATH, exist_ok=True)
os.makedirs(UPLOAD_AUDIO_PATH, exist_ok=True)

# Init file
if not os.path.exists(DATA_PATH):
    with open(DATA_PATH, "w") as f:
        json.dump([], f)

# -----------------------------
# Serve uploads
# -----------------------------
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# -----------------------------
# Mood Analyzer
# -----------------------------
def mood_of(text: str):
    t = text.lower()
    happy = re.findall(r"happy|joy|good|great|excited|love|fun|enjoy", t)
    sad = re.findall(r"sad|bad|upset|angry|stress|depress|tease|shout|cry", t)

    score = len(happy) - len(sad)
    return "Happy" if score > 0 else "Sad" if score < 0 else "Neutral"


@app.post("/analyze")
def analyze(entry: dict):
    mood = mood_of(entry.get("text", ""))
    return {"mood": mood}


# -----------------------------
# Upload image
# -----------------------------
@app.post("/upload/image")
def upload_image(file: UploadFile = File(...)):
    filename = f"img_{os.path.basename(file.filename)}"
    filepath = os.path.join(UPLOAD_IMAGE_PATH, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"path": f"/uploads/images/{filename}"}


# -----------------------------
# Upload audio
# -----------------------------
@app.post("/upload/audio")
def upload_audio(file: UploadFile = File(...)):
    filename = f"audio_{os.path.basename(file.filename)}"
    filepath = os.path.join(UPLOAD_AUDIO_PATH, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"path": f"/uploads/audio/{filename}"}


# -----------------------------
# Save ALL entries
# -----------------------------
@app.post("/save_entries")
def save_entries(entries: List[dict]):
    with open(DATA_PATH, "w") as f:
        json.dump(entries, f, indent=2)
    return {"status": "saved", "count": len(entries)}


# -----------------------------
# Save ONE entry (append)
# -----------------------------
@app.post("/save_entry")
def save_entry(entry: dict):
    try:
        with open(DATA_PATH, "r") as f:
            existing = json.load(f)
    except:
        existing = []

    existing.append(entry)

    with open(DATA_PATH, "w") as f:
        json.dump(existing, f, indent=2)

    return {"status": "stored", "total": len(existing)}


# -----------------------------
# Load entries
# -----------------------------
@app.get("/get_entries")
def get_entries():
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    return {"entries": data}


# -----------------------------
# LifeCard summary
# -----------------------------
@app.get("/life_card")
def life_card():
    with open(DATA_PATH, "r") as f:
        entries = json.load(f)

    total = len(entries)
    if not total:
        return {"summary": "No entries yet."}

    moods = [e.get("mood", "") for e in entries]
    happy = moods.count("Happy")
    sad = moods.count("Sad")

    return {
        "total_entries": total,
        "happy": happy,
        "sad": sad,
        "summary": f"Across {total} entries — {happy} happy, {sad} sad."
    }
