import React, { useState, useMemo } from "react";

const API_BASE = "http://localhost:5000";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MOOD_COLORS = {
  Overwhelmed:  { color:"#dc2626", bg:"rgba(220,38,38,0.08)",    dot:"#dc2626" },
  Sad:          { color:"#2563eb", bg:"rgba(37,99,235,0.08)",     dot:"#2563eb" },
  Frustrated:   { color:"#d97706", bg:"rgba(217,119,6,0.08)",     dot:"#d97706" },
  Angry:        { color:"#e03c5b", bg:"rgba(224,60,91,0.08)",     dot:"#e03c5b" },
  Anxious:      { color:"#b45309", bg:"rgba(180,83,9,0.08)",      dot:"#b45309" },
  Neutral:      { color:"#6b7280", bg:"rgba(107,114,128,0.08)",   dot:"#6b7280" },
  Content:      { color:"#0f766e", bg:"rgba(15,118,110,0.08)",    dot:"#0f766e" },
  Relaxed:      { color:"#0891b2", bg:"rgba(8,145,178,0.08)",     dot:"#0891b2" },
  Peaceful:     { color:"#0e87c8", bg:"rgba(14,135,200,0.08)",    dot:"#0e87c8" },
  Calm:         { color:"#0284c7", bg:"rgba(2,132,199,0.08)",     dot:"#0284c7" },
  Focused:      { color:"#7c3aed", bg:"rgba(124,58,237,0.08)",    dot:"#7c3aed" },
  Motivated:    { color:"#5b47e0", bg:"rgba(91,71,224,0.08)",     dot:"#5b47e0" },
  Positive:     { color:"#047857", bg:"rgba(4,120,87,0.08)",      dot:"#047857" },
  Grateful:     { color:"#15803d", bg:"rgba(21,128,61,0.08)",     dot:"#15803d" },
  Happy:        { color:"#15a06e", bg:"rgba(21,160,110,0.08)",    dot:"#15a06e" },
  Accomplished: { color:"#0369a1", bg:"rgba(3,105,161,0.08)",     dot:"#0369a1" },
  Fulfilled:    { color:"#6d28d9", bg:"rgba(109,40,217,0.08)",    dot:"#6d28d9" },
  Euphoric:     { color:"#7c3aed", bg:"rgba(124,58,237,0.08)",    dot:"#7c3aed" },
};

function getMoodStyle(mood) {
  return MOOD_COLORS[mood] || { color:"#6b7280", bg:"rgba(107,114,128,0.08)", dot:"#6b7280", emoji:"💭" };
}

function formatDate(raw) {
  const d = new Date(raw);
  return d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
}

function formatTime(raw) {
  const d = new Date(raw);
  return d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
}

function getPositivePercent(entries) {
  if (!entries.length) return 0;
  const positive = ["Happy","Positive","Grateful","Fulfilled","Euphoric","Accomplished","Motivated","Content","Calm","Peaceful","Relaxed","Focused"];
  const count = entries.filter(e => positive.includes(e.mood)).length;
  return Math.round((count / entries.length) * 100);
}

export default function LifeCard({ entries = [] }) {
  const years = [...new Set(
    entries.map(e => new Date(e.createdAt || e.dateOnly).getFullYear())
  )].sort((a,b) => b-a);

  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [view, setView] = useState("month");

  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.createdAt || e.dateOnly);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [entries, selectedYear, selectedMonth]);

  const weeks = useMemo(() => {
    const w = {};
    monthEntries.forEach(e => {
      const d = new Date(e.createdAt || e.dateOnly);
      const weekNum = Math.ceil((d.getDate() - d.getDay() + 1) / 7);
      if (!w[weekNum]) w[weekNum] = [];
      w[weekNum].push(e);
    });
    return w;
  }, [monthEntries]);

  const weekKeys = Object.keys(weeks).map(Number).sort((a,b) => a-b);
  const activeWeek = selectedWeek || weekKeys[0] || 1;
  const selectedWeekEntries = weeks[activeWeek] || [];

  const moodCounts = useMemo(() => {
    const c = {};
    monthEntries.forEach(e => { c[e.mood] = (c[e.mood]||0)+1; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]);
  }, [monthEntries]);

  const topMood = moodCounts[0]?.[0];
  const positivePercent = getPositivePercent(monthEntries);
  const displayEntries = view === "month" ? monthEntries : selectedWeekEntries;

  return (
    <section style={{ fontFamily:"'DM Sans', system-ui, sans-serif", paddingBottom:60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .lc-select {
          appearance: none; -webkit-appearance: none;
          padding: 8px 30px 8px 12px; font-size: 13px; font-weight: 600;
          font-family: inherit; color: #1a1a2e;
          border: 1.5px solid #e2e0f0; border-radius: 10px;
          background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235b47e0'/%3E%3C/svg%3E") no-repeat right 10px center;
          cursor: pointer; transition: all 0.15s;
        }
        .lc-select:focus { outline:none; border-color:#5b47e0; box-shadow:0 0 0 3px rgba(91,71,224,0.10); }
        .lc-month-btn { transition: all 0.15s; cursor: pointer; }
        .lc-month-btn:hover { background: rgba(91,71,224,0.06) !important; }
        .lc-week-pill { transition: all 0.2s; cursor: pointer; border: none; font-family: inherit; }
        .lc-week-pill:hover { transform: translateY(-1px); }
        .lc-entry-card { transition: box-shadow 0.2s, transform 0.15s; }
        .lc-entry-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.10) !important; transform: translateY(-1px); }
        .lc-img { transition: transform 0.15s, box-shadow 0.15s; cursor: zoom-in; }
        .lc-img:hover { transform: scale(1.06); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
        .lc-expand { cursor: pointer; background: none; border: none; font-family: inherit; transition: color 0.15s; }
        .lc-expand:hover { color: #5b47e0 !important; }
        .lc-view-btn { transition: all 0.15s; cursor: pointer; font-family: inherit; border: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .lc-fade { animation: fadeUp 0.3s ease forwards; }
        @media (max-width: 640px) {
          .lc-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .lc-top-row { flex-direction: column !important; gap: 12px !important; }
          .lc-month-row { gap: 4px !important; }
          .lc-month-btn { font-size: 11px !important; padding: 5px 8px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#5b47e0", marginBottom:6 }}>
          Memory Book
        </div>
        <h2 style={{ fontSize:30, fontWeight:700, margin:"0 0 6px", fontFamily:"'DM Serif Display', Georgia, serif", color:"#818080", lineHeight:1.15 }}>
          LifeCard
        </h2>
        <p style={{ margin:0, fontSize:14, color:"#7a7a7a", lineHeight:1.6 }}>
          Every entry, every mood, every moment — your personal journal archive.
        </p>
      </div>

      {/* ── Year + Month selector ── */}
      <div className="lc-top-row" style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Year</span>
          <select className="lc-select" value={selectedYear} onChange={e=>{ setSelectedYear(Number(e.target.value)); setSelectedWeek(null); }}>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="lc-month-row" style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {MONTHS_SHORT.map((m,i)=>{
            const isActive = selectedMonth===i;
            const hasEntries = entries.some(e=>{
              const d = new Date(e.createdAt||e.dateOnly);
              return d.getFullYear()===selectedYear && d.getMonth()===i;
            });
            return (
              <button key={i} className="lc-month-btn" onClick={()=>{ setSelectedMonth(i); setSelectedWeek(null); }} style={{
                padding:"7px 12px", borderRadius:8, fontSize:12, fontWeight:600,
                background: isActive?"#5b47e0":"transparent",
                color: isActive?"#fff": hasEntries?"#3a3a3a":"#c4c4c4",
                border: isActive?"none":"1.5px solid",
                borderColor: hasEntries?"#e2e0f0":"#f0eef8",
                position:"relative",
              }}>
                {m}
                {hasEntries && !isActive && (
                  <span style={{ position:"absolute", top:3, right:3, width:4, height:4, borderRadius:"50%", background:"#5b47e0" }} />
                )}
              </button>
            );
          })}
        </div>
        <div style={{ marginLeft:"auto", fontSize:12, color:"#9ca3af", fontWeight:500 }}>
          {monthEntries.length} {monthEntries.length===1?"entry":"entries"} in {MONTHS[selectedMonth]}
        </div>
      </div>

      {monthEntries.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"linear-gradient(135deg,#f8f7ff,#f0f4ff)", borderRadius:20, border:"1.5px dashed #d4d0f0" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>📭</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#3a3a3a", marginBottom:8 }}>No entries in {MONTHS[selectedMonth]} {selectedYear}</div>
          <div style={{ fontSize:14, color:"#9ca3af", maxWidth:280, margin:"0 auto", lineHeight:1.7 }}>
            Start journaling today — your memories will appear here automatically.
          </div>
        </div>
      ) : (
        <>
          {/* ── Stats ── */}
          <div className="lc-stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
            {[
              { label:"Total Entries", value:monthEntries.length, color:"#5b47e0" },
              { label:"Weeks Active", value:weekKeys.length, color:"#15a06e" },
              { label:"Top Mood", value:topMood||"—", icon:getMoodStyle(topMood).emoji, color:getMoodStyle(topMood).color },
              { label:"Positive Days", value:`${positivePercent}%`, color:positivePercent>=60?"#15a06e":positivePercent>=40?"#d97706":"#e03c5b" },
            ].map(s=>(
              <div key={s.label} style={{ background:"#fff", borderRadius:14, border:"1.5px solid #f0eef8", padding:"14px 16px", boxShadow:"0 1px 4px rgba(91,71,224,0.06)" }}>
                <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:10, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:18, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          

          {/* ── View toggle + week pills ── */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <div style={{ display:"flex", background:"#f4f3fc", borderRadius:10, padding:3, gap:2 }}>
              {[["month","All Month"],["week","By Week"]].map(([v,label])=>(
                <button key={v} className="lc-view-btn" onClick={()=>setView(v)} style={{
                  padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600,
                  background:view===v?"#5b47e0":"transparent",
                  color:view===v?"#fff":"#6b7280",
                }}>{label}</button>
              ))}
            </div>

            {view==="week" && weekKeys.map(w=>{
              const isActive = activeWeek===w;
              return (
                <button key={w} className="lc-week-pill" onClick={()=>setSelectedWeek(w)} style={{
                  padding:"7px 14px", borderRadius:10, fontSize:12, fontWeight:600,
                  background:isActive?"#5b47e0":"#fff",
                  color:isActive?"#fff":"#3a3a3a",
                  border:`1.5px solid ${isActive?"#5b47e0":"#e2e0f0"}`,
                  boxShadow:isActive?"0 2px 10px rgba(91,71,224,0.25)":"none",
                }}>
                  Week {w} <span style={{ opacity:0.65, fontSize:11 }}>({(weeks[w]||[]).length})</span>
                </button>
              );
            })}

            <span style={{ marginLeft:"auto", fontSize:12, color:"#9ca3af" }}>
              Showing {displayEntries.length} {displayEntries.length===1?"entry":"entries"}
              {view==="week"?` · Week ${activeWeek}`:""}
            </span>
          </div>

          {/* ── Week mood pills ── */}
          {view==="week" && selectedWeekEntries.length>0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {[...new Set(selectedWeekEntries.map(e=>e.mood))].filter(Boolean).map(mood=>{
                const ms = getMoodStyle(mood);
                return (
                  <span key={mood} style={{
                    display:"inline-flex", alignItems:"center", gap:5, padding:"4px 11px", borderRadius:99,
                    background:ms.bg, color:ms.color, fontSize:12, fontWeight:600, border:`1px solid ${ms.color}20`,
                  }}>
                    {ms.emoji} {mood}
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Entries ── */}
          {displayEntries.length===0 ? (
            <div style={{ textAlign:"center", padding:"50px 20px", background:"#fafaf8", borderRadius:16, border:"1.5px dashed #e8e6e1" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
              <div style={{ fontSize:15, fontWeight:600, color:"#3a3a3a" }}>No entries this week</div>
              <div style={{ fontSize:13, color:"#9ca3af", marginTop:4 }}>Try a different week.</div>
            </div>
          ) : (
            <div className="lc-fade" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {displayEntries.map(e=>{
                const ms = getMoodStyle(e.mood);
                const isExp = expandedId===(e._id||e.id);
                const text = e.text||"";
                const shouldClamp = text.length>200;
                return (
                  <div key={e._id||e.id} className="lc-entry-card" style={{
                    background:"#fff", borderRadius:16, overflow:"hidden",
                    border:"1.5px solid #f0eef8", borderLeft:`4px solid ${ms.color}`,
                    boxShadow:"0 1px 6px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"16px 18px 12px", gap:10, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0f0f0f", marginBottom:2 }}>{formatDate(e.createdAt||e.dateOnly)}</div>
                        {e.createdAt && <div style={{ fontSize:11, color:"#b0b0b0", fontWeight:500 }}>{formatTime(e.createdAt)}</div>}
                      </div>
                      <span style={{
                        display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:99,
                        background:ms.bg, color:ms.color, fontSize:12, fontWeight:700, border:`1px solid ${ms.color}25`, whiteSpace:"nowrap",
                      }}>
                        {ms.emoji} {e.mood||"Neutral"}
                      </span>
                    </div>

                    <div style={{ height:1, background:"#f4f2fc", margin:"0 18px" }} />

                    <div style={{ padding:"12px 18px" }}>
                      <p style={{
                        margin:0, fontSize:14, color:"#3a3a3a", lineHeight:1.75,
                        display:"-webkit-box", WebkitLineClamp:isExp?undefined:4,
                        WebkitBoxOrient:"vertical", overflow:isExp?"visible":"hidden", whiteSpace:"pre-wrap",
                      }}>{text}</p>
                      {shouldClamp && (
                        <button className="lc-expand" onClick={()=>setExpandedId(isExp?null:(e._id||e.id))} style={{ marginTop:6, fontSize:12, fontWeight:600, color:"#9ca3af", padding:0 }}>
                          {isExp?"Show less ↑":"Read more ↓"}
                        </button>
                      )}
                    </div>

                    {e.images?.length>0 && (
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", padding:"4px 18px 14px" }}>
                        {e.images.map((img,i)=>(
                          <img key={i} className="lc-img" src={`${API_BASE}${img}`} alt=""
                            onClick={()=>setLightboxImg(`${API_BASE}${img}`)}
                            style={{ width:88, height:88, objectFit:"cover", borderRadius:10, border:"1.5px solid #f0eef8" }}
                          />
                        ))}
                      </div>
                    )}

                    {e.audio && (
                      <div style={{ padding:"0 18px 14px" }}>
                        <audio controls src={`${API_BASE}${e.audio}`} style={{ width:"100%", borderRadius:8 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div onClick={()=>setLightboxImg(null)} style={{
          position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.88)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:20, cursor:"zoom-out", backdropFilter:"blur(8px)",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{ position:"relative" }}>
            <img src={lightboxImg} alt="" style={{ maxWidth:"88vw", maxHeight:"88vh", borderRadius:14, objectFit:"contain", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }} />
            <button onClick={()=>setLightboxImg(null)} style={{
              position:"absolute", top:-14, right:-14, width:34, height:34, borderRadius:"50%",
              background:"#fff", border:"none", fontSize:16, cursor:"pointer", fontWeight:800,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 2px 10px rgba(0,0,0,0.25)", color:"#0f0f0f",
            }}>✕</button>
          </div>
        </div>
      )}
    </section>
  );
}