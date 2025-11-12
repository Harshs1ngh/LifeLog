from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Entry(BaseModel):
    text: str
@app.get("/", response_class=PlainTextResponse)
def root():
    return "✅ LifeLog API is running! Visit /docs for API endpoints."

@app.post("/analyze")
def analyze(entry: Entry):
    text = entry.text.lower()
    happy_words = re.findall(r"happy|joy|good|great|excited|love", text)
    sad_words = re.findall(r"sad|bad|upset|angry|depress", text)
    mood_score = len(happy_words) - len(sad_words)
    if mood_score > 0:
        mood = "Happy"
    elif mood_score < 0:
        mood = "Sad"
    else:
        mood = "Neutral"
    return {"mood": mood, "score": mood_score}

@app.post("/life_card")
def life_card(entries: list[Entry]):
    total = len(entries)
    if not total:
        return {"summary": "No entries yet."}
    moods = [analyze(e)["mood"] for e in entries]
    happy_count = moods.count("Happy")
    sad_count = moods.count("Sad")
    return {
        "title": "Life Card — Simple Summary",
        "summary": f"In your last {total} entries, you had {happy_count} happy days and {sad_count} sad days.",
    }
