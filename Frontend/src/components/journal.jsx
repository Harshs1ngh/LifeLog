// src/components/Journal.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Smile, Frown, Meh } from "lucide-react";

/*
  Journal.jsx - Final version
  - Auto mood detection (local rule-based)
  - Summary modal (Apple glass style)
  - Save entry -> uploads media to FastAPI (/upload/image, /upload/audio)
  - Confirm -> POST /save_entries to persist server/data/entries.json
  - Uses localStorage for immediate UX and syncs with server on confirm
*/

// ----------------- Local sentiment analyzer (rule-based) -----------------
const POSITIVE_LEX = {
  good: 1, great: 1.4, excellent: 1.7, happy: 1.3, joy: 1.2, fun: 1.1,
  enjoyed: 1.2, loved: 1.5, proud: 1.3, calm: 0.9, relaxed: 0.9, uplifted: 1.1,
  excited: 1.3, energized: 1.2, grateful: 1.4, productive: 1.2, success: 1.5
};

const NEGATIVE_LEX = {
  sad: -1.3, bad: -1.0, angry: -1.4, depressed: -1.7, anxious: -1.4,
  scared: -1.3, upset: -1.2, stressed: -1.4, lonely: -1.2, teased: -1.1,
  yelled: -1.3, shouted: -1.3, "shouted at": -1.4, hate: -1.6, frustrated: -1.3,
  insult: -1.2, bullied: -1.6, sick: -1.1, hurt: -1.3, disappointed: -1.2
};

const INTENSIFIERS = { very: 1.25, really: 1.2, extremely: 1.4, so: 1.15, super: 1.25 };
const DAMPENERS = { slightly: 0.85, somewhat: 0.9, abit: 0.9, "a bit": 0.9 };
const NEGATIONS = new Set(["not","no","never","n't","none","cannot","can't"]);

function splitSentences(text){
  if(!text) return [];
  const safe = text.replace(/\n/g, ". ");
  return safe.split(/(?<=[.?!])\s+/).map(s=>s.trim()).filter(Boolean);
}
function simpleTokens(sentence){
  return sentence.toLowerCase().replace(/[“”"()——,:;\/]/g," ").split(/\s+/).filter(Boolean);
}
function scoreSentence(sentence){
  const tokens = simpleTokens(sentence);
  let score = 0, posHits = [], negHits = [];
  let i = 0;
  while(i < tokens.length){
    const w = tokens[i];
    const two = i+1 < tokens.length ? `${w} ${tokens[i+1]}` : null;
    if(two && NEGATIVE_LEX[two] !== undefined){
      const val = NEGATIVE_LEX[two];
      negHits.push({word: two, val}); score += val; i += 2; continue;
    }
    if(INTENSIFIERS[w]){
      const nxt = tokens[i+1];
      if(nxt && (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt])){
        const base = (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt]);
        const adj = base * INTENSIFIERS[w];
        if(base > 0) posHits.push({word:nxt,val:adj}); else negHits.push({word:nxt,val:adj});
        score += adj; i += 2; continue;
      }
    }
    if(NEGATIONS.has(w)){
      const nxt = tokens[i+1];
      if(nxt && (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt])){
        const base = (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt]);
        const flipped = -base * 0.95;
        if(flipped > 0) posHits.push({word:nxt,val:flipped}); else negHits.push({word:nxt,val:flipped});
        score += flipped; i += 2; continue;
      }
    }
    if(POSITIVE_LEX[w]){ posHits.push({word:w,val:POSITIVE_LEX[w]}); score += POSITIVE_LEX[w]; }
    else if(NEGATIVE_LEX[w]){ negHits.push({word:w,val:NEGATIVE_LEX[w]}); score += NEGATIVE_LEX[w]; }
    else if(DAMPENERS[w]){
      const nxt = tokens[i+1];
      if(nxt && (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt])){
        const base = (POSITIVE_LEX[nxt] || NEGATIVE_LEX[nxt]);
        const adj = base * DAMPENERS[w];
        if(base > 0) posHits.push({word:nxt,val:adj}); else negHits.push({word:nxt,val:adj});
        score += adj; i += 2; continue;
      }
    }
    i++;
  }
  const punctBoost = (sentence.match(/!/g) || []).length * 0.15;
  score = score * (1 + punctBoost);
  const polarity = score > 0 ? "positive": score < 0 ? "negative" : "neutral";
  return { score, polarity, positives: posHits, negatives: negHits, text: sentence.trim() };
}

function mapTo7(avgScore){
  const min=-3.5,max=3.5;
  const norm = (avgScore - min) / (max - min);
  const scaled = Math.round(norm*6)+1;
  return Math.max(1, Math.min(7, scaled));
}

const LEVEL_LABELS = {
  1: "Bad Day",
  2: "No Luck",
  3: "Neutral",
  4: "Vibing Day",
  5: "Good Day",
  6: "Great Day",
  7: "Excellent Day"
};

function generateSummaryFromEvents(events, overallLevel){
  const negs = events.filter(e=>e.score<0).sort((a,b)=>a.score-b.score);
  const poss = events.filter(e=>e.score>0).sort((a,b)=>b.score-a.score);
  const topNeg = negs.slice(0,2).map(e=>e.text);
  const topPos = poss.slice(0,2).map(e=>e.text);
  let summaryParts = [];
  if(topPos.length && topNeg.length) summaryParts.push(`You had both positive moments and stressful ones today — for example, ${topPos.join("; ")} but also ${topNeg.join("; ")}.`);
  else if(topNeg.length) summaryParts.push(`Today had several difficult moments such as ${topNeg.join("; ")}.`);
  else if(topPos.length) summaryParts.push(`Today included some nice moments like ${topPos.join("; ")}.`);
  else summaryParts.push("Today was fairly neutral with no strongly emotional events recorded.");
  let interp = "";
  const lvl = overallLevel;
  if(lvl >= 6) interp = "Overall you seem to have had a really positive day — nice!";
  else if(lvl === 5) interp = "Overall the day was good and balanced.";
  else if(lvl === 4) interp = "Overall it looks like a vibing/neutral day with ups and downs.";
  else if(lvl === 3) interp = "Overall the day felt neutral.";
  else if(lvl === 2) interp = "Overall the day leaned negative — some unlucky or stressful moments.";
  else interp = "Overall this was a difficult day and it's okay to feel that.";
  const adviceTemplates = {
    positive: [
      "Keep this momentum — little routines help keep good days steady.",
      "Nice day — celebrate the wins, even if small."
    ],
    neutral: [
      "A neutral day is a good chance to rest and reset for tomorrow.",
      "Small regenerating actions (walk, nap, water) can tilt the next day positively."
    ],
    negative: [
      "It’s okay — hard moments pass. Try to breathe, rest, and do one small caring thing for yourself.",
      "Don't be harsh on yourself; reach out to someone you trust or take a short break."
    ]
  };
  let advicePool = lvl >= 5 ? adviceTemplates.positive : lvl === 3 || lvl === 4 ? adviceTemplates.neutral : adviceTemplates.negative;
  const advice = advicePool[Math.floor(Math.random()*advicePool.length)];
  return { summary: summaryParts.join(" "), interpretation: interp, advice };
}

// ----------------- UI helpers -----------------
const MoodIcon = ({ mood }) => {
  if (mood === "Happy") return <Smile size={16} color="#22c55e" />;
  if (mood === "Sad") return <Frown size={16} color="#ef4444" />;
  return <Meh size={16} color="#94a3b8" />;
};

const API_BASE = "http://127.0.0.1:8000";

// ----------------- Component -----------------
export default function Journal({
  entries = [],
  todayText,
  setTodayText,
  saveEntry,     // optional (keeps backward compatibility)
  addEntry,      // optional (if parent passes an add function)
  deleteEntry
}) {
  // local UI state
  const [localEntries, setLocalEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("entries")) || []; } catch { return []; }
  });
  const [imageFiles, setImageFiles] = useState([]); // File objects
  const [imagePreviews, setImagePreviews] = useState([]); // objectURLs
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [generated, setGenerated] = useState(null); // analysis pack
  const [extraText, setExtraText] = useState("");

  // sync props -> localEntries when parent updates
  useEffect(() => {
    if (entries && entries.length) {
      setLocalEntries(entries);
      try { localStorage.setItem("entries", JSON.stringify(entries)); } catch {}
    }
  }, [entries]);

  // build today's entries and combined text
  const todayIso = new Date().toISOString().split("T")[0];
  const todaysEntries = (localEntries || []).filter(e => e.dateOnly === todayIso);

  const combinedText = useMemo(() => {
    const base = todaysEntries.map(e=>e.text || "").join(". ");
    const extra = todayText ? `. ${todayText}` : "";
    return (base + extra).trim();
  }, [todaysEntries, todayText]);

  // detected summary/mood from combinedText
  const detected = useMemo(() => {
    if (!combinedText) return { label: "Not analyzed", score: null };
    // local analysis:
    const sentences = splitSentences(combinedText);
    const events = sentences.map(s => {
      const sc = scoreSentence(s);
      return { text: s, score: sc.score, positives: sc.positives, negatives: sc.negatives };
    });
    let total = 0, weight = 0;
    events.forEach((ev,i)=>{ const w = 1 + i*0.05; total += ev.score * w; weight += w; });
    const avg = weight ? total/weight : 0;
    const mapped = mapTo7(avg);
    return { label: LEVEL_LABELS[mapped], score: mapped };
  }, [combinedText]);

  // helpers to preview files
  useEffect(() => {
    return () => {
      // revoke object URLs when component unmounts
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      if(audioPreview) URL.revokeObjectURL(audioPreview);
    };
  }, [imagePreviews, audioPreview]);

  const onSelectImages = (files) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 6); // limit 6
    const prev = arr.map(f => URL.createObjectURL(f));
    setImageFiles(prevFiles => [...prevFiles, ...arr]);
    setImagePreviews(prev => [...prev, ...prev]);
  };

  const onSelectAudio = (file) => {
    if (!file) return;
    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
  };

  const removeImageAt = (idx) => {
    setImageFiles(prev => prev.filter((_,i)=>i!==idx));
    setImagePreviews(prev => prev.filter((_,i)=>i!==idx));
  };
  const clearAudio = () => { if(audioPreview) URL.revokeObjectURL(audioPreview); setAudioFile(null); setAudioPreview(null); };

  // upload helpers: upload each image/audio to server -> returns path(s)
  async function uploadImagesToServer(files){
    const paths = [];
    for(const f of files){
      const fd = new FormData();
      fd.append("file", f, f.name);
      try{
        const res = await fetch(`${API_BASE}/upload/image`, { method: "POST", body: fd });
        if(!res.ok) throw new Error("upload failed");
        const j = await res.json();
        // server returns { path: "/uploads/images/filename" }
        paths.push(j.path);
      }catch(err){
        console.error("image upload failed", err);
      }
    }
    return paths;
  }
  async function uploadAudioToServer(file){
    if(!file) return null;
    const fd = new FormData();
    fd.append("file", file, file.name);
    try{
      const res = await fetch(`${API_BASE}/upload/audio`, { method: "POST", body: fd });
      if(!res.ok) throw new Error("upload failed");
      const j = await res.json();
      return j.path;
    }catch(err){
      console.error("audio upload failed", err);
      return null;
    }
  }

  // save one entry locally (uploads media first, then creates entry object)
  const createLocalEntry = async () => {
    setError(""); setLoading(true);
    try {
      if(!todayText.trim()){ setError("Write something before saving an entry."); setLoading(false); return; }

      // upload media
      const imagePaths = await uploadImagesToServer(imageFiles);
      const audioPath = audioFile ? await uploadAudioToServer(audioFile) : null;

      // run local analysis on this entry
      const analysis = (function localAnalyze(text){
        const sentences = splitSentences(text);
        const events = sentences.map(s=>scoreSentence(s));
        let total=0, weight=0;
        events.forEach((ev,i)=>{ const w=1+i*0.05; total+=ev.score*w; weight+=w; });
        const avg = weight ? total/weight : 0;
        const mapped = mapTo7(avg);
        const pack = generateSummaryFromEvents(events, mapped);
        return { label: LEVEL_LABELS[mapped], score: mapped, summary: pack.summary, advice: pack.advice };
      })(todayText);

      const now = new Date();
      const newEntry = {
        id: Date.now(),
        date: now.toLocaleString(),
        dateOnly: now.toISOString().split("T")[0],
        text: todayText,
        mood: analysis.label,
        images: imagePaths || [],
        audio: audioPath || null,
        confirmed: false
      };

      // update local state & localStorage
      const updated = [newEntry, ...localEntries];
      setLocalEntries(updated);
      try { localStorage.setItem("entries", JSON.stringify(updated)); } catch(e){ console.warn("localStorage set failed", e); }

      // call parent addEntry if provided (keeps compatibility)
      if(typeof addEntry === "function"){
        try{ addEntry(newEntry); }catch(e){/*ignore*/ }
      }

      // clear draft & previews
      setTodayText("");
      setImageFiles([]); setImagePreviews([]);
      clearAudio();
    } catch(err){
      console.error("createLocalEntry failed", err);
      setError("Failed to save entry locally.");
    } finally {
      setLoading(false);
    }
  };

  // generate summary from combined text (today's entries + draft)
  const handleGenerateSummary = () => {
    setError("");
    const src = combinedText.trim();
    if(!src){ setError("Nothing to summarize — write or save entries first."); return; }
    // analyze combined text
    const sentences = splitSentences(src);
    const events = sentences.map(s => {
      const sc = scoreSentence(s);
      return { text: s, score: sc.score, positives: sc.positives, negatives: sc.negatives };
    });
    let total = 0, weight = 0;
    events.forEach((ev,i)=>{ const w = 1 + i*0.05; total += ev.score * w; weight += w; });
    const avg = weight ? total/weight : 0;
    const mapped = mapTo7(avg);
    const packSummary = generateSummaryFromEvents(events, mapped);
    const pack = {
      score: mapped,
      label: LEVEL_LABELS[mapped],
      summary: packSummary.summary + " " + packSummary.interpretation,
      advice: packSummary.advice,
      reason: (() => {
        const topNeg = events.filter(e=>e.score<0).slice(0,2).map(e=>e.text);
        const topPos = events.filter(e=>e.score>0).slice(0,2).map(e=>e.text);
        const parts=[]; if(topNeg.length) parts.push(`Negatives: ${topNeg.join("; ")}`); if(topPos.length) parts.push(`Positives: ${topPos.join("; ")}`); return parts.join(" | ") || "Balanced/no strong signals.";
      })(),
      events
    };
    setGenerated(pack);
    setSummaryOpen(true);
  };

const handleConfirmAndSave = async () => {
  setLoading(true);
  setError("");
  try {
    // mark today's entries confirmed
    const updated = localEntries.map(e => 
      e.dateOnly === todayIso ? { ...e, confirmed: true } : e
    );

    // POST to server (CORRECT FORMAT)
    const res = await fetch(`${API_BASE}/save_entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: updated }),
    });

    if (!res.ok) throw new Error("server save failed");

    // update local state & storage
    setLocalEntries(updated);
    localStorage.setItem("entries", JSON.stringify(updated));

    setSummaryOpen(false);
    alert("✅ Saved to server!");

  } catch (err) {
    console.error("confirm save failed", err);
    setError("Failed to save to server. Check backend and CORS.");
  } finally {
    setLoading(false);
  }
};

  // simple delete entry (local)
  const handleDelete = (id) => {
    const updated = localEntries.filter(e => e.id !== id);
    setLocalEntries(updated);
    try { localStorage.setItem("entries", JSON.stringify(updated)); } catch {}
    if(typeof deleteEntry === "function") deleteEntry(id);
  };

  // render
  return (
    <section className="page journal-page">
      <div className="journal-top" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <div>
          <h2 style={{margin:0}}>Daily Reflection</h2>
          <p className="muted" style={{margin:0}}>Auto mood detection · Local summaries · Server-backed storage</p>
        </div>

        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div className="mood-pill" title="Detected mood" style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px",borderRadius:999,background:"linear-gradient(90deg,#fff,#f7f8fb)",border:"1px solid rgba(15,23,42,0.04)",fontWeight:700}}>
            <MoodIcon mood={detected.label === "Excellent Day" || detected.label === "Great Day" || detected.label === "Good Day" ? "Happy" : detected.label === "Bad Day" || detected.label === "No Luck" ? "Sad" : "Neutral"} />
            <span style={{fontWeight:700}}>{detected.label}</span>
          </div>

          <button className="btn-ghost" onClick={handleGenerateSummary} disabled={!combinedText.trim()}>
            Summary
          </button>
        </div>
      </div>

      {/* summary stats */}
      <div className="daily-summary" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:14}}>
        <div className="card small"><h4>Today's Mood</h4><div className="big">{detected.label}</div></div>
        <div className="card small"><h4>Entries Today</h4><div className="big">{todaysEntries.length}</div></div>
        <div className="card small"><h4>Draft Words</h4><div className="big">{(todayText||"").trim().split(/\s+/).filter(Boolean).length}</div></div>
      </div>

      {/* write card */}
      <div className="card write-card" style={{marginTop:14}}>
        <h3 style={{marginTop:0}}>How are you feeling?</h3>
        <textarea className="j-textarea" placeholder="Write freely..." value={todayText} onChange={(e)=> setTodayText(e.target.value)} style={{width:"100%",minHeight:120,padding:12,borderRadius:10,border:"1px solid rgba(15,23,42,0.06)"}} />

        <div className="attachments-row" style={{display:"flex",gap:12,alignItems:"center",marginTop:12}}>
          <label className="file-btn" style={{cursor:"pointer"}}>
            <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={(e)=> onSelectImages(e.target.files)} />
            <span className="file-btn-inner" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"rgba(0,0,0,0.03)"}}>Add images</span>
          </label>

          <label className="file-btn" style={{cursor:"pointer"}}>
            <input type="file" accept="audio/*" style={{display:"none"}} onChange={(e)=> onSelectAudio(e.target.files[0])} />
            <span className="file-btn-inner" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"rgba(0,0,0,0.03)"}}>Add audio</span>
          </label>

          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            <button className="save-entry-btn" onClick={createLocalEntry} disabled={loading}>{loading ? "Saving..." : "Save Entry"}</button>
            <button className="btn-ghost" onClick={() => { setTodayText(""); setImageFiles([]); setImagePreviews([]); clearAudio(); }}>Clear</button>
          </div>
        </div>

        {/* previews */}
        {imagePreviews.length > 0 && (
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
            {imagePreviews.map((src, i) => (
              <div key={i} style={{position:"relative",width:120,height:80,borderRadius:8,overflow:"hidden",boxShadow:"0 6px 18px rgba(0,0,0,0.06)"}}>
                <img src={src} alt={`img-${i}`} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                <button onClick={()=> removeImageAt(i)} style={{position:"absolute",right:6,top:6,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:6,padding:"2px 6px",cursor:"pointer"}}>✕</button>
              </div>
            ))}
          </div>
        )}

        {audioPreview && (
          <div style={{display:"flex",gap:8,alignItems:"center",marginTop:12}}>
            <audio controls src={audioPreview} style={{width:280}} />
            <button className="btn-ghost small" onClick={clearAudio}>Remove</button>
          </div>
        )}
      </div>

      {/* entries feed */}
      <div className="entries" style={{marginTop:16,display:"grid",gap:12}}>
        {todaysEntries.length === 0 ? (
  <div className="card empty">No entries yet — write something to begin.</div>
) : (
  todaysEntries.slice().map(entry => (
            <article key={entry.id} className="entry-card card" style={{padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,color:"#6b7280"}}>{entry.date}</div>
                  <div style={{fontWeight:700}}>{entry.mood}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button className="btn-ghost" onClick={() => { setTodayText(entry.text); /* set previews if stored as paths won't convert back */ }}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(entry.id)}>Delete</button>
                </div>
              </div>

              <p style={{marginTop:12}}>{entry.text}</p>

              {entry.images && entry.images.length > 0 && (
                <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                  {entry.images.map((p,i) => (
                    <img key={i} src={`${API_BASE}${p}`} alt={`ent-${entry.id}-${i}`} style={{width:110,height:72,objectFit:"cover",borderRadius:8}} />
                  ))}
                </div>
              )}

              {entry.audio && (
                <div style={{marginTop:10}}>
                  <audio controls src={`${API_BASE}${entry.audio}`} style={{width:"100%"}} />
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* final confirm area */}
      <div style={{marginTop:14}} className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h4 style={{margin:0}}>Confirm Today's Entries</h4>
            <p className="muted" style={{margin:0}}>When you confirm, today's entries are saved to server/data/entries.json.</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={handleConfirmAndSave} disabled={loading}>{loading ? "Saving..." : "Confirm & Save"}</button>
          </div>
        </div>
      </div>

      {/* Summary modal (apple glass style) */}
      {summaryOpen && generated && (
        <div className="glass-overlay" onClick={() => setSummaryOpen(false)} style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,backdropFilter:"blur(10px)"}}>
          <div className="glass-summary-card" onClick={e=>e.stopPropagation()} style={{width:420,background:"linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.58))",borderRadius:18,padding:20,boxShadow:"0 20px 60px rgba(2,6,23,0.22)",border:"1px solid rgba(255,255,255,0.6)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
              <div>
                <h3 style={{margin:0}}>Day Summary</h3>
                <div className="muted" style={{fontSize:13}}>{new Date().toDateString()}</div>
              </div>

              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                <div className={`score-badge lvl-${generated.score}`} style={{padding:"8px 14px",borderRadius:12,fontWeight:800,color:"#fff"}}>
                  {generated.label} ({generated.score}/7)
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-primary" onClick={handleConfirmAndSave}>Yes — that's it</button>
                  <button className="btn-ghost" onClick={() => { setSummaryOpen(false); }}>There's more</button>
                </div>
              </div>
            </div>

            <div style={{marginTop:12,borderTop:"1px dashed rgba(15,23,42,0.04)",paddingTop:12}}>
              <h4 style={{margin:"8px 0"}}>Overview</h4>
              <p style={{lineHeight:1.6}}>{generated.summary}</p>

              <h4 style={{margin:"8px 0 6px 0"}}>Advice</h4>
              <p style={{fontWeight:600}}>{generated.advice}</p>

              <h5 style={{marginTop:12,color:"#6b7280",fontSize:13}}>Why we scored it this way</h5>
              <p style={{color:"#6b7280",fontSize:13}}>{generated.reason}</p>

              <h5 style={{marginTop:10}}>Events detected</h5>
              <ul style={{listStyle:"none",padding:0,margin:0,display:"grid",gap:6}}>
                {generated.events.slice(0,6).map((ev,i) => (
                  <li key={i} style={{padding:"6px 8px",borderRadius:8,background:ev.score<0 ? "rgba(239,68,68,0.06)" : ev.score>0 ? "rgba(34,197,94,0.06)" : "transparent", color: ev.score<0 ? "#7f1d1d" : ev.score>0 ? "#155724" : "#374151"}}>{ev.text}</li>
                ))}
              </ul>
            </div>

            <button onClick={() => setSummaryOpen(false)} style={{position:"absolute",right:12,top:12,background:"transparent",border:"none",fontSize:18}}>✕</button>
          </div>
        </div>
      )}

      {error && <div style={{marginTop:12,color:"#7f1d1d"}}>{error}</div>}
    </section>
  );
}
