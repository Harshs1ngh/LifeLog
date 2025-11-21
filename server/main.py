from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json, os, re, shutil
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
IMAGE_DIR = os.path.join(UPLOAD_DIR, "images")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audio")

DATA_PATH = os.path.join(DATA_DIR, "entries2.json")

print("📌 Using DATA_PATH =", DATA_PATH)

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

if not os.path.exists(DATA_PATH):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, indent=2)

# Serve uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


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


# Upload image
@app.post("/upload/image")
def upload_image(file: UploadFile = File(...)):
    filename = f"img_{os.path.basename(file.filename)}"
    filepath = os.path.join(IMAGE_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"path": f"/uploads/images/{filename}"}


# Upload audio
@app.post("/upload/audio")
def upload_audio(file: UploadFile = File(...)):
    filename = f"audio_{os.path.basename(file.filename)}"
    filepath = os.path.join(AUDIO_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"path": f"/uploads/audio/{filename}"}


# Save ALL entries 
@app.post("/save_entries")
def save_entries(payload: dict):
    print("📥 Incoming payload:", payload) 

    if "entries" not in payload:
        raise HTTPException(status_code=400, detail="Missing key: entries")

    entries = payload["entries"]

    print("📦 Entries count:", len(entries))  

    # Write entire list
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print("💾 Saved entries into:", DATA_PATH)

    return {"status": "saved", "count": len(entries)}

# Save ONE entry (append)
@app.post("/save_entry")
def save_entry(entry: dict):
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
    except:
        existing = []

    existing.append(entry)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)

    return {"status": "stored", "total": len(existing)}


# Load entries
@app.get("/get_entries")
def get_entries():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"entries": data}


# LifeCard summary
@app.get("/life_card")
def life_card():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
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
