import React, { useMemo, useState, useEffect } from "react";
import { api, API_BASE } from "../services/api.js";
import "./journal.css";

const POSITIVE_LEX = {
  good: 1.0, great: 1.4, excellent: 1.8, amazing: 1.8, awesome: 1.6,
  happy: 1.3, joyful: 1.5, joy: 1.3, fun: 1.1, enjoyed: 1.3,
  loved: 1.7, like: 1.1, satisfied: 1.2, content: 1.1,
  proud: 1.4, confident: 1.3, motivated: 1.3,
  calm: 1.0, relaxed: 1.0, peaceful: 1.2,
  excited: 1.4, thrilled: 1.6, energetic: 1.3, energized: 1.3,
  grateful: 1.5, thankful: 1.4, blessed: 1.5,
  productive: 1.3, focused: 1.2, efficient: 1.2,
  success: 1.6, successful: 1.6, progress: 1.3, improvement: 1.3,
  inspired: 1.4, creative: 1.2, hopeful: 1.3, optimistic: 1.4,
  happiness: 1.5, happyness: 1.5,
  family: 1.2, together: 1.1,
  played: 1.1, playing: 1.1, games: 0.9,
  laugh: 1.4, laughed: 1.4, laughing: 1.4,
  enjoy: 1.3, enjoying: 1.3, enjoyable: 1.3,
  wonderful: 1.6, fantastic: 1.6, lovely: 1.4,
  nice: 1.1, glad: 1.2, cheerful: 1.3,
  celebrate: 1.4, celebration: 1.4,
  love: 1.6, loving: 1.5,
  opportunity: 1.2, finally: 1.1, better: 1.1, best: 1.4,
  learning: 1.1, learned: 1.1, achieved: 1.4, winning: 1.3,
  relieved: 1.2, refreshed: 1.2, recovered: 1.1,
  comfortable: 1.0, safe: 1.0, healthy: 1.2,
  accomplished: 1.6, fulfilled: 1.5,
};

const NEGATIVE_LEX = {
  bad: -1.0, worse: -1.4, terrible: -1.8, awful: -1.7, horrible: -1.8,
  sad: -1.4, unhappy: -1.3, depressed: -1.9, hopeless: -1.7,
  angry: -1.5, furious: -1.8, annoyed: -1.2, irritated: -1.2,
  anxious: -1.5, worried: -1.3, nervous: -1.2,
  scared: -1.4, afraid: -1.4,
  upset: -1.3, hurt: -1.4, disappointed: -1.3, regret: -1.3,
  stressed: -1.5, overwhelmed: -1.6, exhausted: -1.4, tired: -1.1,
  lonely: -1.3, isolated: -1.4,
  frustrated: -1.4, stuck: -1.2,
  hate: -1.8, dislike: -1.2,
  insulted: -1.3, bullied: -1.7,
  sick: -1.2, unwell: -1.2, pain: -1.4,
  argument: -1.4, conflict: -1.3, wrong: -1.1, mistake: -1.2,
  failed: -1.5, failure: -1.5, lost: -1.2, losing: -1.2,
  crying: -1.4, cried: -1.4, broke: -1.2, broken: -1.3,
  miss: -1.0, missing: -1.0, confused: -1.1, useless: -1.5,
};

const INTENSIFIERS = {
  very: 1.3, really: 1.25, extremely: 1.5,
  so: 1.2, super: 1.3, incredibly: 1.5,
  highly: 1.3, deeply: 1.4,
};

const DAMPENERS = {
  slightly: 0.8, somewhat: 0.85, abit: 0.85,
  "a bit": 0.85, little: 0.85, mildly: 0.8,
  kinda: 0.9, sortof: 0.9,
};

const NEGATIONS = new Set([
  "not", "no", "never", "none",
  "n't", "cannot", "can't",
  "dont", "don't", "won't", "didn't",
]);

function splitSentences(text) {
  if (!text) return [];
  return text.replace(/\n/g, ". ").split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
}

function simpleTokens(s) {
  return s.toLowerCase().replace(/[""\\"()——,:;\/]/g, " ").split(/\s+/).filter(Boolean);
}

function scoreSentence(sentence) {
  const tokens = simpleTokens(sentence);
  let score = 0, posHits = [], negHits = [], i = 0;
  while (i < tokens.length) {
    const w = tokens[i], two = i + 1 < tokens.length ? `${w} ${tokens[i + 1]}` : null;
    if (two && NEGATIVE_LEX[two] !== undefined) {
      negHits.push({ word: two, val: NEGATIVE_LEX[two] }); score += NEGATIVE_LEX[two]; i += 2; continue;
    }
    if (INTENSIFIERS[w]) {
      const nxt = tokens[i + 1];
      if (nxt && (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt])) {
        const base = POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt], adj = base * INTENSIFIERS[w];
        (base > 0 ? posHits : negHits).push({ word: nxt, val: adj }); score += adj; i += 2; continue;
      }
    }
    if (NEGATIONS.has(w)) {
      const nxt = tokens[i + 1];
      if (nxt && (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt])) {
        const base = POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt], flipped = -base * 0.95;
        (flipped > 0 ? posHits : negHits).push({ word: nxt, val: flipped }); score += flipped; i += 2; continue;
      }
    }
    if (POSITIVE_LEX[w]) { posHits.push({ word: w, val: POSITIVE_LEX[w] }); score += POSITIVE_LEX[w]; }
    else if (NEGATIVE_LEX[w]) { negHits.push({ word: w, val: NEGATIVE_LEX[w] }); score += NEGATIVE_LEX[w]; }
    else if (DAMPENERS[w]) {
      const nxt = tokens[i + 1];
      if (nxt && (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt])) {
        const base = POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt], adj = base * DAMPENERS[w];
        (base > 0 ? posHits : negHits).push({ word: nxt, val: adj }); score += adj; i += 2; continue;
      }
    }
    i++;
  }
  score *= 1 + (sentence.match(/!/g) || []).length * 0.15;
  return { score, positives: posHits, negatives: negHits, text: sentence.trim() };
}

function mapTo7(avg) {
  if (avg >= 2.5)  return 10;
  if (avg >= 1.8)  return 9;
  if (avg >= 1.2)  return 8;
  if (avg >= 0.7)  return 7; 
  if (avg >= 0.3)  return 6;
  if (avg >= 0.1)  return 5;
  if (avg >= -0.1) return 4;
  if (avg >= -0.6) return 3;
  if (avg >= -1.2) return 2;
  return 1;
}

const LEVEL_LABELS = {
  1: "Overwhelmed", 2: "Heavy", 3: "BurnOut",
  4: "Neutral", 5: "Content", 6: "Positive",
  7: "Happy", 8: "Accomplished", 9: "Fulfilled", 10: "Euphoric",
};

const MOOD_CONFIG = {
  Overwhelmed:  { color: "#7f1d1d", bg: "rgba(127,29,29,0.08)",  bar: "#7f1d1d" },
  Heavy:          { color: "#1d4ed8", bg: "rgba(29,78,216,0.08)",  bar: "#1d4ed8" },
  BurnOut:   { color: "#b45309", bg: "rgba(180,83,9,0.08)",   bar: "#b45309" },
  Normal:      { color: "#4b5563", bg: "rgba(0, 106, 255, 0.08)",   bar: "#4b5563" },
  Content:      { color: "#0f766e", bg: "rgba(15,118,110,0.08)", bar: "#23c9bb" },
  Positive:     { color: "#047857", bg: "rgba(4,120,87,0.08)",   bar: "#047857" },
  Happy:        { color: "#15803d", bg: "rgba(21,128,61,0.08)",  bar: "#15803d" },
  Accomplished: { color: "#0369a1", bg: "rgba(3,105,161,0.08)",  bar: "#0369a1" },
  Fulfilled:    { color: "#7c3aed", bg: "rgba(124,58,237,0.08)", bar: "#7c3aed" },
  Euphoric:     { color: "#6d28d9", bg: "rgba(109,40,217,0.08)", bar: "#6d28d9" },
};

function generateSummary(events, level) {
  const negs = events.filter(e => e.score < 0).sort((a, b) => a.score - b.score).slice(0, 2).map(e => e.text);
  const poss = events.filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map(e => e.text);
  let summary = negs.length && poss.length
    ? `You had both positive moments and stressful ones today — ${poss.join("; ")} but also ${negs.join("; ")}.`
    : negs.length ? `Today had some difficult moments: ${negs.join("; ")}.`
      : poss.length ? `Today included some nice moments: ${poss.join("; ")}.`
        : "Today was fairly neutral with no strongly emotional events recorded.";
  const interp = level >= 6 ? "Overall a really positive day — nice!"
    : level === 5 ? "Overall the day was good and balanced."
      : level === 4 ? "Overall it looks like a neutral day."
        : level === 3 ? "Overall the day felt a bit tough."
          : "Overall this was a difficult day and it's okay to feel that.";
  const pool = level >= 5
    ? ["Keep this momentum — little routines help keep good days steady.", "Nice day — celebrate the wins, even if small."]
    : level >= 3
      ? ["A neutral day is a good chance to rest and reset for tomorrow.", "Small regenerating actions (walk, nap, water) can tilt the next day positively."]
      : ["It's okay — hard moments pass. Try to breathe, rest, and do one small caring thing for yourself.", "Don't be harsh on yourself; reach out to someone you trust."];
  return { summary, interpretation: interp, advice: pool[Math.floor(Math.random() * pool.length)] };
}

function localAnalyze(text) {
  const events = splitSentences(text).map(s => scoreSentence(s));
  let total = 0, weight = 0;
  events.forEach((ev, i) => { const w = 1 + i * 0.05; total += ev.score * w; weight += w; });
  const mapped = mapTo7(weight ? total / weight : 0);
  return { label: LEVEL_LABELS[mapped], score: mapped, events, ...generateSummary(events, mapped) };
}

const cfg = (label) => MOOD_CONFIG[label] || MOOD_CONFIG.Neutral;

function MoodBadge({ label }) {
  const c = cfg(label);
  return (
    <div className="j-mood-badge" style={{ background: c.bg, border: `1.5px solid ${c.color}22`, color: c.color }}>
      {label}
    </div>
  );
}

function MoodBar({ score }) {
  const c = cfg(LEVEL_LABELS[score] || "Neutral");
  return (
    <div className="j-mood-bar-wrap">
      <div className="j-mood-bar-track">
        <div className="j-mood-bar-fill" style={{ width: `${((score - 1) / 9) * 100}%`, background: c.bar }} />
      </div>
      <span className="j-mood-bar-label" style={{ color: c.color }}>{score}/10</span>
    </div>
  );
}

function StatCard({ label, value, accent, darkMode }) {
  return (
    <div className={`j-stat-card ${darkMode ? "dark" : ""}`}>
      <span className="j-stat-label">{label}</span>
      <span className="j-stat-value">{value}</span>
    </div>
  );
}

function MoodTyping({ label }) {
  const MOOD_PHRASES = {
    Overwhelmed:  ["Take it one breath at a time.", "You don't have to do it all today.", "Rest is productive too.", "It's okay to ask for help."],
    Heavy:        ["Tough days pass.", "You're carrying a lot — be gentle with yourself.", "Small steps still count.", "It's okay to feel this way."],
    BurnOut:      ["Slow down. You matter more than your output.", "Even the best need a reset.", "Rest before you run empty.", "Recovery is part of the process."],
    Neutral:      ["A quiet day is still a good day.", "Steady is underrated.", "Not every day needs to be great.", "You showed up. That counts."],
    Content:      ["You're doing well.", "Contentment is its own kind of joy.", "Enjoy the calm.", "This is a good place to be."],
    Positive:     ["Keep this energy going!", "Good vibes, good day.", "You're on a roll.", "Positivity is contagious — spread it."],
    Happy:        ["Love to see it!", "This energy is everything.", "Happiness suits you.", "Savour this moment."],
    Accomplished: ["Look at you go!", "You earned this.", "Hard work pays off.", "Proud of what you did."],
    Fulfilled:    ["You're living with purpose.", "This is what it's all about.", "Deep satisfaction is rare — enjoy it.", "You made something matter today."],
    Euphoric:     ["Today is one for the books!", "Absolutely thriving!", "Peak mode: activated.", "Bottle this feeling — it's gold."],
  };

  const phrases = MOOD_PHRASES[label] || MOOD_PHRASES.Neutral;
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx]     = useState(0);
  const [deleting, setDeleting]   = useState(false);
  const [paused, setPaused]       = useState(false);

  useEffect(() => {
    setPhraseIdx(0); setCharIdx(0); setDeleting(false); setPaused(false); setDisplayed("");
  }, [label]);

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setDeleting(true); setPaused(false); }, 2200);
      return () => clearTimeout(t);
    }
    const current = phrases[phraseIdx];
    if (!deleting) {
      if (charIdx < current.length) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        }, 38);
        return () => clearTimeout(t);
      } else {
        setPaused(true);
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        }, 22);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setPhraseIdx(i => (i + 1) % phrases.length);
      }
    }
  }, [charIdx, deleting, paused, phraseIdx, phrases]);

  const c = cfg(label);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <MoodBadge label={label} />
      <div style={{
        fontSize: 12,
        color: c.color,
        minWidth: 160,
        textAlign: "right",
        fontStyle: "italic",
        minHeight: 18,
        letterSpacing: "0.01em",
      }}>
        {displayed}
        <span style={{
          display: "inline-block",
          width: 1.5,
          height: "1em",
          background: c.color,
          marginLeft: 2,
          verticalAlign: "text-bottom",
          animation: "j-blink 0.9s step-end infinite",
        }} />
      </div>
    </div>
  );
}

export default function Journal({ entries = [], todayText, setTodayText, saveEntry, addEntry, deleteEntry, refreshEntries, currentUser }) {

  const draftKey = `draftEntries_${currentUser?.id || "guest"}`;

  const [localEntries, setLocalEntries] = useState(() => {
    try {
      const todayIso = new Date().toISOString().split("T")[0];
      const drafts = JSON.parse(localStorage.getItem(draftKey)) || [];
      return drafts.filter(e => e.dateOnly === todayIso);
    } catch { return []; }
  });

  const [imageFiles, setImageFiles]       = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [audioFile, setAudioFile]         = useState(null);
  const [audioPreview, setAudioPreview]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [summaryOpen, setSummaryOpen]     = useState(false);
  const [generated, setGenerated]         = useState(null);
  const [expandedEntry, setExpandedEntry] = useState(null);

  // Reload correct drafts when the logged-in user changes
  useEffect(() => {
    try {
      const todayIso = new Date().toISOString().split("T")[0];
      const drafts = JSON.parse(localStorage.getItem(draftKey)) || [];
      setLocalEntries(drafts.filter(e => e.dateOnly === todayIso));
    } catch { setLocalEntries([]); }
  }, [draftKey]);

  useEffect(() => () => {
    imagePreviews.forEach(u => URL.revokeObjectURL(u));
    if (audioPreview) URL.revokeObjectURL(audioPreview);
  }, []); // eslint-disable-line

  const todayIso   = new Date().toISOString().split("T")[0];
  const todaysEntries = (localEntries || []).filter(e => e.dateOnly === todayIso);

  const combinedText = useMemo(() => {
    const base = todaysEntries.map(e => e.text || "").join(". ");
    return (base + (todayText ? `. ${todayText}` : "")).trim();
  }, [todaysEntries, todayText]);

  const detected = useMemo(() => {
    const savedText = todaysEntries.map(e => e.text || "").join(". ").trim();
    if (!savedText) return { label: "Neutral", score: 4 };
    const events = splitSentences(savedText).map(s => scoreSentence(s));
    let total = 0, weight = 0;
    events.forEach((ev, i) => { const w = 1 + i * 0.05; total += ev.score * w; weight += w; });
    const score = mapTo7(weight ? total / weight : 0);
    return { label: LEVEL_LABELS[score], score };
  }, [todaysEntries]);

  const moodCfg  = cfg(detected.label);
  const wordCount = (todayText || "").trim().split(/\s+/).filter(Boolean).length;
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const onSelectImages = (files) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 6);
    setImageFiles(p => [...p, ...arr]);
    setImagePreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))]);
  };
  const onSelectAudio = (file) => {
    if (!file) return;
    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
  };
  const removeImageAt = (idx) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(p => p.filter((_, i) => i !== idx));
    setImagePreviews(p => p.filter((_, i) => i !== idx));
  };
  const clearAudio = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioFile(null);
    setAudioPreview(null);
  };

  async function uploadImages(files) {
    const paths = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f, f.name);
      try {
        const res = await api.post("/entries/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        paths.push(res.data.path);
      } catch (err) { console.error("image upload failed", err); }
    }
    return paths;
  }

  async function uploadAudio(file) {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file, file.name);
    try {
      const res = await api.post("/entries/upload/audio", fd, { headers: { "Content-Type": "multipart/form-data" } });
      return res.data.path;
    } catch (err) { console.error("audio upload failed", err); return null; }
  }

  const createLocalEntry = async () => {
    setError(""); setLoading(true);
    try {
      if (!todayText.trim()) { setError("Write something before saving an entry."); setLoading(false); return; }
      const imagePaths = await uploadImages(imageFiles);
      const audioPath  = await uploadAudio(audioFile);
      const analysis   = localAnalyze(todayText);
      const now        = new Date();
      const newEntry   = {
        id:       Date.now(),
        date:     now.toLocaleString(),
        dateOnly: now.toISOString().split("T")[0],
        text:     todayText,
        mood:     analysis.label,
        images:   imagePaths || [],
        audio:    audioPath  || null,
      };
      const updated = [newEntry, ...localEntries];
      setLocalEntries(updated);
      localStorage.setItem(draftKey, JSON.stringify(updated));
    } catch (err) {
      console.error("createLocalEntry failed", err);
      setError("Failed to save entry.");
    } finally {
      setTodayText(""); setImageFiles([]); setImagePreviews([]); clearAudio(); setLoading(false);
    }
  };

  const handleGenerateSummary = () => {
    setError("");
    const src = combinedText.trim();
    if (!src) { setError("Write or save at least one entry first."); return; }
    const a = localAnalyze(src);
    const topNeg = a.events.filter(e => e.score < 0).slice(0, 2).map(e => e.text);
    const topPos = a.events.filter(e => e.score > 0).slice(0, 2).map(e => e.text);
    const parts = [];
    if (topNeg.length) parts.push(`Negatives: ${topNeg.join("; ")}`);
    if (topPos.length) parts.push(`Positives: ${topPos.join("; ")}`);
    setGenerated({
      score:   a.score,
      label:   a.label,
      summary: a.summary + " " + a.interpretation,
      advice:  a.advice,
      reason:  parts.join(" | ") || "Balanced — no strong signals.",
      events:  a.events,
    });
    setSummaryOpen(true);
  };

  const handleConfirmAndSave = async () => {
    setLoading(true); setError("");
    try {
      if (!localEntries.length) { setError("No entries to save for today."); setLoading(false); return; }
      for (const e of localEntries) {
        await api.post("/entries/save", {
          text:     e.text,
          images:   e.images  || [],
          audio:    e.audio   || null,
          dateOnly: e.dateOnly,
        });
      }
      setLocalEntries([]);
      localStorage.removeItem(draftKey);
      setSummaryOpen(false);
      if (typeof refreshEntries === "function") refreshEntries();
      alert("Saved to server! Your entries are now accessible on any device.");
    } catch (err) {
      console.error("confirm save failed", err);
      setError("Failed to save to server. Is the backend running?");
    } finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    const updated = localEntries.filter(e => e.id !== id);
    setLocalEntries(updated);
    localStorage.setItem(draftKey, JSON.stringify(updated));
  };
 

  return (
    <>
      <div className="j-page">

        {/* ── Header — no Summary button here anymore ── */}
        
        <div className="j-header">
          <div>
            <h1>Daily Reflection</h1>
            <p className="j-date">{todayLabel}</p>
          </div>
          <div className="j-header-right">
  <MoodTyping label={detected.label} />
</div>
        </div>

        <div className="j-inner">

          {/* Stats */}
          <div className="j-stats-row">
            <StatCard label="Today's Mood"  value={detected.label} accent={moodCfg.color} />
            <StatCard label="Entries Today" value={todaysEntries.length} />
            <StatCard label="Draft Words"   value={wordCount} />
          </div>

          {/* Sentiment bar */}
          {todaysEntries.length > 0 && (
            <div className="j-sentiment-card">
              <div className="j-section-label">Day Score</div>
              <MoodBar score={detected.score} />
            </div>
          )}

          {/* Write card */}
          <div className="j-write-card">
            <h3 >How are you feeling today?</h3>
            <textarea
              className="j-textarea"
              placeholder="Write freely — no judgement here..."
              value={todayText}
              onChange={e => setTodayText(e.target.value)}
            />
            <div className="j-attach-row">
              <label className="j-attach-btn">
                <input type="file" accept="image/*" multiple onChange={e => onSelectImages(e.target.files)} />
                Images
              </label>
              <label className="j-attach-btn">
                <input type="file" accept="audio/*" onChange={e => onSelectAudio(e.target.files[0])} />
                Audio
              </label>
              <div className="j-actions-right">
                <button className="j-btn-ghost" onClick={() => { setTodayText(""); setImageFiles([]); setImagePreviews([]); clearAudio(); }}>
                  Clear
                </button>
                <button className="j-btn-primary" onClick={createLocalEntry} disabled={loading}>
                  {loading ? "Saving…" : "Save & Analyse"}
                </button>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="j-img-previews">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="j-img-thumb">
                    <img src={src} alt="" />
                    <button className="j-img-remove" onClick={() => removeImageAt(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {audioPreview && (
              <div className="j-audio-preview">
                <span style={{ fontSize: 18 }}>🎵</span>
                <audio controls src={audioPreview} />
                <button className="j-btn-ghost" onClick={clearAudio}>Remove</button>
              </div>
            )}
          </div>
          
          {error && <div className="j-error">⚠ {error}</div>}
          <br />

          {/* Today's entries */}
          <div className="j-section-label">Today's Entries · {todaysEntries.length}</div>

          {todaysEntries.length === 0 ? (
            <div className="j-empty-state">
              <div className="j-empty-icon">✏️</div>
              No entries yet — write something to begin.
            </div>
          ) : todaysEntries.map(entry => {
            const ec    = cfg(entry.mood);
            const isExp = expandedEntry === (entry.id || entry._id);
            return (
              <div key={entry.id || entry._id} className="j-entry-card" style={{ borderLeft: `3.5px solid ${ec.color}` }}>
                <div className="j-entry-top">
                  <div>
                    <div className="j-entry-mood-row">
                      <span className="j-entry-mood" style={{ color: ec.color }}>{entry.mood}</span>
                    </div>
                    <div className="j-entry-date">{entry.date || new Date(entry.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="j-entry-actions">
                    <button className="j-btn-ghost" onClick={() => setTodayText(entry.text)}>Edit</button>
                    <button className="j-btn-danger" onClick={() => handleDelete(entry.id || entry._id)}>Delete</button>
                  </div>
                </div>
                <p
                  className={`j-entry-text ${isExp ? "" : "clamped"}`}
                  onClick={() => setExpandedEntry(isExp ? null : (entry.id || entry._id))}
                >
                  {entry.text}
                </p>
                {entry.text.length > 180 && (
                  <button className="j-read-more" onClick={() => setExpandedEntry(isExp ? null : (entry.id || entry._id))}>
                    {isExp ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
                {entry.images?.length > 0 && (
                  <div className="j-entry-images">
                    {entry.images.map((p, i) => <img key={i} src={`${API_BASE}${p}`} alt="" />)}
                  </div>
                )}
                {entry.audio && (
                  <div className="j-entry-audio">
                    <audio controls src={`${API_BASE}${entry.audio}`} />
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Confirm card — opens summary modal ── */}
          <div
            className="j-confirm-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              border: "2px solid #000000",
              borderRadius: 15,
            }}
          >
            <div>
              <div className="j-confirm-title">Confirm Today's Entries</div>
              <div className="j-confirm-sub">
                Review your day's mood summary, then save everything to the server permanently.
              </div>
            </div>
            <button
              className="j-btn-primary"
              onClick={handleGenerateSummary}
              disabled={!combinedText.trim() || loading}
              style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap" }}
            >
               Confirm Entries
            </button>
          </div>

        </div>
      </div>

      {/* ── Summary Modal — save button is here ── */}
      {summaryOpen && generated && (() => {
        const gc = cfg(generated.label);
        return (
          <div className="j-overlay" onClick={() => setSummaryOpen(false)}>
            <div className="j-modal" onClick={e => e.stopPropagation()}>
              <button className="j-modal-close" onClick={() => setSummaryOpen(false)}>✕</button>
              <div className="j-modal-header">
                <div className="j-section-label">Day Summary · {new Date().toDateString()}</div>
                <h2 style={{ color: gc.color }}>{generated.label}</h2>
              </div>
              <div style={{ marginBottom: 18 }}>
                <MoodBar score={generated.score} />
              </div>
              <div className="j-summary-block" style={{ background: gc.bg }}>
                <div className="j-section-label" style={{ color: gc.color }}>Overview</div>
                <p>{generated.summary}</p>
              </div>
              <div className="j-advice-block">
                <div className="j-section-label">Advice</div>
                <p>{generated.advice}</p>
              </div>
              {generated.events.length > 0 && (
                <div>
                  <div className="j-section-label">Detected Moments</div>
                  <div className="j-events-grid">
                    {generated.events.slice(0, 6).map((ev, i) => (
                      <div key={i} className={`j-event-item ${ev.score < 0 ? "neg" : ev.score > 0 ? "pos" : "neu"}`}>
                        {ev.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="j-reason"><strong>Why this score:</strong> {generated.reason}</p>
              <div className="j-modal-actions">
                <button className="j-btn-ghost" onClick={() => setSummaryOpen(false)}>Close</button>
                <button className="j-btn-primary" onClick={handleConfirmAndSave} disabled={loading}>
                  {loading ? "Saving…" : "Save to server ✓"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}