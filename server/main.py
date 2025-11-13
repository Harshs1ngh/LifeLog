from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, os, re, shutil
from typing import List

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
DATA_PATH = "data/entries.json"
UPLOAD_IMAGE_PATH = "uploads/images"
UPLOAD_AUDIO_PATH = "uploads/audio"

os.makedirs("data", exist_ok=True)
os.makedirs(UPLOAD_IMAGE_PATH, exist_ok=True)
os.makedirs(UPLOAD_AUDIO_PATH, exist_ok=True)

# Init JSON file
if not os.path.exists(DATA_PATH):
    with open(DATA_PATH, "w") as f:
        json.dump([], f)


# -----------------------------
#  🔥 Mood Analyzer (simple)
# -----------------------------
def mood_of(text: str):
    t = text.lower()
    happy = re.findall(r"happy|joy|good|great|excited|love|fun|enjoy", t)
    sad = re.findall(r"sad|bad|upset|angry|stress|depress|tease|shout|cry", t)

    score = len(happy) - len(sad)

    if score > 0:
        return "Happy"
    elif score < 0:
        return "Sad"
    return "Neutral"


@app.post("/analyze")
def analyze(entry: dict):
    mood = mood_of(entry.get("text", ""))
    return {"mood": mood}


# -----------------------------
#  🔥 File Upload Endpoints
# -----------------------------
@app.post("/upload/image")
def upload_image(file: UploadFile = File(...)):
    filename = f"img_{os.path.basename(file.filename)}"
    filepath = os.path.join(UPLOAD_IMAGE_PATH, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"path": f"/uploads/images/{filename}"}


@app.post("/upload/audio")
def upload_audio(file: UploadFile = File(...)):
    filename = f"audio_{os.path.basename(file.filename)}"
    filepath = os.path.join(UPLOAD_AUDIO_PATH, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"path": f"/uploads/audio/{filename}"}


# -----------------------------
#  🔥 Save all entries
# -----------------------------
@app.post("/save_entries")
def save_entries(entries: List[dict]):
    with open(DATA_PATH, "w") as f:
        json.dump(entries, f, indent=2)

    return {"status": "saved", "count": len(entries)}


# -----------------------------
#  🔥 Load entries
# -----------------------------
@app.get("/get_entries")
def get_entries():
    with open(DATA_PATH, "r") as f:
        data = json.load(f)

    return {
        "entries": data    # ⭐ Now frontend receives the correct key
    }


# -----------------------------
#  🔥 LifeLog Summary
# -----------------------------
@app.get("/life_card")
def life_card():
    with open(DATA_PATH, "r") as f:
        entries = json.load(f)

    total = len(entries)
    if not total:
        return {"summary": "No entries yet."}

    moods = [e["mood"] for e in entries]
    happy = moods.count("Happy")
    sad = moods.count("Sad")

    return {
        "total_entries": total,
        "happy": happy,
        "sad": sad,
        "summary": f"Across {total} entries — {happy} were happy, {sad} were sad."
    }
# -----------------------------
#  🔥 Save ONE confirmed entry (APPENDS)
# -----------------------------
@app.post("/save_entry")
def save_entry(entry: dict):

    # 1. Load existing entries
    try:
        with open(DATA_PATH, "r") as f:
            existing = json.load(f)
    except:
        existing = []

    # 2. Append the new entry
    existing.append(entry)

    # 3. Save back to file
    with open(DATA_PATH, "w") as f:
        json.dump(existing, f, indent=2)

    return {
        "status": "stored",
        "total": len(existing)
    }
