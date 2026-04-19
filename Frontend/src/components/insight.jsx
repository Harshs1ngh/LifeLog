import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ── design tokens ─────────────────────────────────────────────────────── */
const T = {
  // palette
  ink:     "#0f0f0f",
  inkMid:  "#3a3a3a",
  inkSoft: "#7a7a7a",
  inkFade: "#b0b0b0",
  paper:   "#fafaf8",
  card:    "#ffffff",
  border:  "#e8e6e1",
  borderSoft: "#f0ede8",

  // accents
  violet: "#5b47e0",
  violetSoft: "rgba(91,71,224,0.10)",
  emerald: "#15a06e",
  emeraldSoft: "rgba(21,160,110,0.10)",
  amber: "#d97706",
  amberSoft: "rgba(217,119,6,0.10)",
  rose: "#e03c5b",
  roseSoft: "rgba(224,60,91,0.10)",
  sky: "#0e87c8",
  skySoft: "rgba(14,135,200,0.10)",

  // radii
  r: "12px",
  rLg: "18px",
  rXl: "24px",

  // shadows
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
  shadowMd: "0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
};

/* ── constants ─────────────────────────────────────────────────────────── */
const LEVELS = [
  { v:1, label:"Rough",     color:"#e03c5b" },
  { v:2, label:"Low",       color:"#f97316" },
  { v:3, label:"Uneasy",    color:"#eab308" },
  { v:4, label:"Neutral",   color:"#9ca3af" },
  { v:5, label:"Good",      color:"#15a06e" },
  { v:6, label:"Great",     color:"#0e87c8" },
  { v:7, label:"Excellent", color:"#5b47e0" },
];

const POSITIVE_KEYWORDS = ["happy","joy","grateful","love","excited","good","great","awesome","amazing","blessed","productive","energized","hope","calm","peaceful","motivated","inspired","proud","content","cheerful","happiness", "happyness", "family", "played", "playing", "games",
"laugh", "laughed", "laughing", "wonderful", "fantastic", "lovely",
"celebrate", "fun", "enjoy", "enjoying", "nice", "glad", "together"];
const NEGATIVE_KEYWORDS = ["sad","angry","depressed","tired","lonely","stressed","anxious","bad","upset","hate","hurt","lost","down","overwhelmed","frustrated","exhausted","worried","hopeless","irritated","drained"];

const EMOTION_KEYWORDS = {
  Happy:       ["happy","joy","excited","cheerful","content","grateful","love"],
  Anxious:     ["anxious","worried","nervous","stressed","panic"],
  Angry:       ["angry","frustrated","irritated","furious","upset"],
  Sad:         ["sad","depressed","down","hopeless","lonely","cry"],
  Motivated:   ["motivated","inspired","productive","energized","focused"],
  Grateful:    ["grateful","thankful","blessed","appreciate"],
  Calm:        ["calm","peaceful","relaxed","serene","tranquil"],
  Overwhelmed: ["overwhelmed","exhausted","drained","tired"],
};

const EMOTION_COLORS = {
  Happy:"#15a06e", Anxious:"#f09833", Angry:"#e03c5b",
  Sad:"#0e87c8", Motivated:"#5b47e0", Grateful:"#15a06e",
  Calm:"#0e87c8", Overwhelmed:"#f97316", Neutral:"#9ca3af",
};

/* ── helpers ───────────────────────────────────────────────────────────── */
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
function isoDate(d){ 
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function moodBase(mood) {
  if (!mood) return 4;
  const l = mood.toLowerCase();
  if (l.includes("euphoric") || l.includes("fulfilled")) return 7;
  if (l.includes("positive") || l.includes("happy") || l.includes("content")) return 6;
  if (l.includes("stable") || l.includes("good") || l.includes("calm")) return 5;
  if (l.includes("neutral") || l.includes("uneasy")) return 4;
  if (l.includes("anxious") || l.includes("low") || l.includes("frustrated")) return 3;
  if (l.includes("drained") || l.includes("sad") || l.includes("angry")) return 2;
  if (l.includes("overwhelmed")) return 2;
  return 4;
}
function scoreEntry(entry){
  let s=moodBase(entry.mood); const txt=(entry.text||"").toLowerCase();
  const wc=txt.trim().split(/\s+/).filter(Boolean).length;
  if (wc > 120) s += 1.5;
else if (wc > 60) s += 1;
else if (wc > 30) s += 0.5;
else if (wc < 6) s -= 1;
  let pos=0,neg=0;
  POSITIVE_KEYWORDS.forEach(k=>{if(txt.includes(k))pos++;});
  NEGATIVE_KEYWORDS.forEach(k=>{if(txt.includes(k))neg++;});
  s+=Math.min(2,pos*0.6); s-=Math.min(2,neg*0.8);
  return clamp(Math.round(s),1,7);
}
function detectEmotion(entry){
  const txt=(entry.text||"").toLowerCase();
  for(const [em,kws] of Object.entries(EMOTION_KEYWORDS)){ if(kws.some(k=>txt.includes(k)))return em; }
  const score=scoreEntry(entry);
  if(score>=5)return "Happy"; if(score<=2)return "Sad"; return "Neutral";
}
function isDeepReflection(entry){
  const txt=(entry.text||"").toLowerCase(); const wc=txt.trim().split(/\s+/).filter(Boolean).length;
  const phrases=["because","realize","understand","reflect","wonder","question","feel like","i think","i believe","it made me","i learned","i noticed"];
  return wc>=50&&phrases.some(p=>txt.includes(p));
}
function groupByDate(arr){
  return (arr||[]).reduce((acc,e)=>{ const d=e.dateOnly||isoDate(e.date); (acc[d]=acc[d]||[]).push(e); return acc; },{});
}
function avgScore(list){ if(!list||!list.length)return null; return Math.round((list.reduce((a,e)=>a+scoreEntry(e),0)/list.length)*10)/10; }
function levelFor(score){ return LEVELS[clamp(Math.round(score||4),1,7)-1]; }

/* ── sub-components ────────────────────────────────────────────────────── */
function Card({ children, style={} }){
  return (
    <div style={{
      background: T.card, borderRadius: T.rLg, border:`1px solid ${T.border}`,
      boxShadow: T.shadow, overflow:"hidden", ...style
    }}>{children}</div>
  );
}

function CardPad({ children, style={} }){
  return <div style={{ padding:"20px 22px", ...style }}>{children}</div>;
}

function Label({ children, color, style={} }){
  return (
    <div style={{
      fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase",
      color: color||T.inkSoft, marginBottom:12, ...style
    }}>{children}</div>
  );
}

function StatPill({ icon, label, value, sub, accent=T.violet }){
  return (
    <Card style={{ flex:1, minWidth:140 }}>
      <CardPad style={{ padding:"16px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background: accent+"1a", color:accent,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:15, flexShrink:0,
          }}>{icon}</div>
          <span style={{ fontSize:11, color:T.inkSoft, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
        </div>
        <div style={{ fontSize:22, fontWeight:700, color:T.ink, lineHeight:1.1 }}>{value}</div>
        {sub && <div style={{ fontSize:12, color:T.inkSoft, marginTop:4 }}>{sub}</div>}
      </CardPad>
    </Card>
  );
}

function MoodDot({ color, size=8 }){
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

function EmotionBar({ name, count, total }){
  const pct = total>0 ? Math.round((count/total)*100) : 0;
  const c = EMOTION_COLORS[name]||"#9ca3af";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      <div style={{ fontSize:12, color:T.inkMid, width:78, flexShrink:0, fontWeight:500 }}>{name}</div>
      <div style={{ flex:1, height:5, background:T.borderSoft, borderRadius:99 }}>
        <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:99, transition:"width 0.6s ease" }} />
      </div>
      <div style={{ fontSize:12, color:T.inkFade, width:32, textAlign:"right", fontWeight:600 }}>{pct}%</div>
    </div>
  );
}

function PatternRow({ text, detail, positive }){
  return (
    <div style={{
      display:"flex", gap:12, padding:"12px 0",
      borderBottom:`1px solid ${T.borderSoft}`,
    }}>
      <div style={{
        width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
        background: positive ? T.emeraldSoft : T.borderSoft,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, color: positive ? T.emerald : T.inkSoft,
      }}>{positive ? "↑" : "→"}</div>
      <div>
        <div style={{ fontSize:13.5, color:T.ink, lineHeight:1.55 }}>{text}</div>
        {detail && <div style={{ fontSize:12, color:T.inkSoft, marginTop:3 }}>{detail}</div>}
      </div>
    </div>
  );
}

function SuggestionRow({ text, idx }){
  const accents = [T.violet, T.emerald, T.amber, T.sky, T.rose];
  const c = accents[idx % accents.length];
  return (
    <div style={{
      display:"flex", gap:12, padding:"12px 14px",
      background: c+"0d", borderRadius:T.r, marginBottom:8,
      border:`1px solid ${c}20`,
    }}>
      <div style={{ fontSize:14, color:c, flexShrink:0, marginTop:1 }}>✦</div>
      <div style={{ fontSize:13.5, color:T.ink, lineHeight:1.55 }}>{text}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  const lvl = v ? levelFor(v) : null;
  return (
    <div style={{
      background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
      padding:"10px 14px", boxShadow:T.shadowMd,
    }}>
      <div style={{ fontSize:12, color:T.inkSoft, marginBottom:4 }}>{label}</div>
      {v ? <>
        <div style={{ fontSize:16, fontWeight:700, color:lvl.color }}>{v}/7</div>
        <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>{lvl.label}</div>
      </> : <div style={{ fontSize:13, color:T.inkFade }}>No entry</div>}
    </div>
  );
};

/* ── main ───────────────────────────────────────────────────────────────── */
export default function Insights({ entries=[] }){
  const [searchQ, setSearchQ] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [chartRange, setChartRange] = useState("week");

  const grouped = useMemo(()=>groupByDate(entries),[entries]);
  const dayScores = useMemo(()=>{
    const map={};
    Object.keys(grouped).forEach(d=>{map[d]=avgScore(grouped[d]);});
    return map;
  },[grouped]);

  const weeklyChartData = useMemo(()=>{
    const arr=[];
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const iso=isoDate(d);
      arr.push({ day:d.toLocaleDateString(undefined,{weekday:"short"}), score:dayScores[iso]||0, iso });
    }
    return arr;
  },[dayScores]);

  const monthlyChartData = useMemo(()=>{
    const now=new Date(); const y=now.getFullYear(),m=now.getMonth();
    const days=new Date(y,m+1,0).getDate();
    return Array.from({length:days},(_,i)=>{
      const iso=new Date(y,m,i+1).toISOString().split("T")[0];
      return { day:String(i+1), score:dayScores[iso]||0, iso };
    });
  },[dayScores]);

  const chartData = chartRange==="week" ? weeklyChartData : monthlyChartData;

  const monthlyHeatmap = useMemo(()=>{
    const now=new Date(); const y=now.getFullYear(),m=now.getMonth();
    const monthStart=new Date(y,m,1); const monthEnd=new Date(y,m+1,0);
    const gridStart=new Date(monthStart); gridStart.setDate(monthStart.getDate()-monthStart.getDay());
    const gridEnd=new Date(monthEnd); gridEnd.setDate(monthEnd.getDate()+(6-monthEnd.getDay()));
    const grid=[];
    for(let d=new Date(gridStart);d<=gridEnd;d.setDate(d.getDate()+1)){
      const iso=isoDate(d);
      grid.push({date:iso,display:d.getDate(),score:dayScores[iso]||0,inMonth:d.getMonth()===m});
    }
    return grid;
  },[dayScores]);

  const {currentStreak,longestStreak}=useMemo(()=>{
    const dates=Object.keys(grouped).sort(); const set=new Set(dates);
    let current=0; let d=new Date();
    while(set.has(isoDate(d))){current++;d.setDate(d.getDate()-1);}
    let longest=0,i=0;
    while(i<dates.length){
      let count=1,a=new Date(dates[i]),j=i+1;
      while(j<dates.length){if((new Date(dates[j])-a)/86400000===1){count++;a=new Date(dates[j]);j++;}else break;}
      longest=Math.max(longest,count);i=j;
    }
    return {currentStreak:current,longestStreak:longest};
  },[grouped]);

  const weeklyAvg=useMemo(()=>{
    const vals=weeklyChartData.map(d=>d.score).filter(Boolean);
    if(!vals.length)return null;
    return Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10)/10;
  },[weeklyChartData]);

  const weekDelta=useMemo(()=>{
    const getAvg=(start,end)=>{
      const vals=[];
      for(let i=start;i<=end;i++){const d=new Date();d.setDate(d.getDate()-i);const s=dayScores[isoDate(d)];if(s)vals.push(s);}
      return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
    };
    const tw=getAvg(0,6),lw=getAvg(7,13);
    if(!tw||!lw)return null;
    return Math.round(((tw-lw)/lw)*100);
  },[dayScores]);

  const pieData=useMemo(()=>{
    const c={Happy:0,Neutral:0,Sad:0};
    for(let i=0;i<7;i++){
      const d=new Date();d.setDate(d.getDate()-i);
      (grouped[isoDate(d)]||[]).forEach(e=>{
        const s=scoreEntry(e);
        if(s>=5)c.Happy++;else if(s>=3)c.Neutral++;else c.Sad++;
      });
    }
    return [{name:"Happy",value:c.Happy},{name:"Neutral",value:c.Neutral},{name:"Sad",value:c.Sad}];
  },[grouped]);

  const PIE_COLORS_MAP={Happy:T.emerald,Neutral:"#9ca3af",Sad:T.rose};

  const {emotionFrequency,totalEmotionCount,topEmotion}=useMemo(()=>{
    const counts={};
    for(let i=0;i<7;i++){
      const d=new Date();d.setDate(d.getDate()-i);
      (grouped[isoDate(d)]||[]).forEach(e=>{const em=detectEmotion(e);counts[em]=(counts[em]||0)+1;});
    }
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    return {emotionFrequency:counts,totalEmotionCount:total,topEmotion:top};
  },[grouped]);

  const reflectionStats=useMemo(()=>{
    const all=entries||[],deep=all.filter(isDeepReflection).length;
    const pct=all.length?Math.round((deep/all.length)*100):0;
    return {total:all.length,deep,pct};
  },[entries]);

  const weekdayVsWeekend=useMemo(()=>{
    const wd=[],we=[];
    Object.entries(grouped).forEach(([date,list])=>{
      const dow=new Date(date).getDay(),s=avgScore(list);
      if(s==null)return;
      (dow===0||dow===6?we:wd).push(s);
    });
    const avg=arr=>arr.length?Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10:null;
    return {weekday:avg(wd),weekend:avg(we)};
  },[grouped]);

  const patterns=useMemo(()=>{
    const list=[];
    if(weekdayVsWeekend.weekday!=null&&weekdayVsWeekend.weekend!=null){
      const diff=weekdayVsWeekend.weekend-weekdayVsWeekend.weekday;
      if(Math.abs(diff)>0.4)list.push({text:diff>0?`Weekdays feel heavier (avg ${weekdayVsWeekend.weekday}/7 vs ${weekdayVsWeekend.weekend}/7 weekends)`:`Weekdays lift your mood more (avg ${weekdayVsWeekend.weekday}/7)`,detail:diff>0?"Try building small breaks or rituals into your weekday routine.":"Your structured weekdays seem to support your mood.",positive:diff<0});
    }
    if(topEmotion){const pct=totalEmotionCount>0?Math.round(((emotionFrequency[topEmotion]||0)/totalEmotionCount)*100):0;list.push({text:`"${topEmotion}" is your dominant emotion this week (${pct}% of entries)`,positive:["Happy","Motivated","Calm","Grateful"].includes(topEmotion)});}
    if(weekDelta!=null)list.push({text:weekDelta>8?`Mood up ${weekDelta}% vs last week`:weekDelta<-8?`Mood down ${Math.abs(weekDelta)}% vs last week`:"Mood is stable vs last week",detail:weekDelta>8?"Something's working — reflect on what made this week better.":weekDelta<-8?"A dip is normal. Try to note what's weighing on you.":null,positive:weekDelta>=0});
    if(currentStreak>2)list.push({text:`${currentStreak}-day journaling streak`,detail:"Consistency is one of the strongest predictors of self-awareness.",positive:true});
    if(reflectionStats.pct<30&&reflectionStats.total>2)list.push({text:`Only ${reflectionStats.pct}% of entries are deep reflections`,detail:"Longer, reflective entries give you richer insights over time.",positive:false});
    if(!list.length)list.push({text:"Keep journaling — patterns emerge after 7+ days",positive:false});
    return list;
  },[weekdayVsWeekend,topEmotion,totalEmotionCount,emotionFrequency,weekDelta,currentStreak,reflectionStats]);

  const suggestions=useMemo(()=>{
    const s=[];
    if(reflectionStats.pct<40&&reflectionStats.total>1)s.push("Try writing about why you felt a certain way, not just what happened.");
    if(weekdayVsWeekend.weekday!=null&&weekdayVsWeekend.weekday<3.5)s.push("Weekday stress seems high — try a short mindfulness moment before journaling.");
    if(topEmotion==="Anxious"||topEmotion==="Overwhelmed")s.push("You've felt overwhelmed lately. Try listing tomorrow's tasks in your journal tonight.");
    if(currentStreak===0)s.push("You haven't journaled recently. Even a few sentences today can restart your routine.");
    if(weeklyAvg!=null&&weeklyAvg>=5.5)s.push("You're having a great week! Reflect on what's working so you can replicate it.");
    if(weekDelta!=null&&weekDelta<-15)s.push("Your mood has dipped this week. Acknowledging what's hard is the first step.");
    if(!s.length){s.push("Experiment with journaling at a different time of day.");s.push("Add one thing you're grateful for to each entry — small habit, big impact.");}
    return s;
  },[reflectionStats,weekdayVsWeekend,topEmotion,currentStreak,weeklyAvg,weekDelta]);

  const searchResults=useMemo(()=>{
    const q=searchQ.trim().toLowerCase();
    if(!q)return[];
    const matched=(entries||[]).filter(e=>(e.text||"").toLowerCase().includes(q)||(e.mood||"").toLowerCase().includes(q));
    const byDate=groupByDate(matched);
    return Object.keys(byDate).sort((a,b)=>b.localeCompare(a)).map(date=>({date,items:byDate[date]}));
  },[searchQ,entries]);

  const {bestDay,worstDay}=useMemo(()=>{
    const scored=Object.entries(dayScores).filter(([,v])=>v!=null);
    if(!scored.length)return{};
    scored.sort((a,b)=>b[1]-a[1]);
    return{bestDay:scored[0],worstDay:scored[scored.length-1]};
  },[dayScores]);

  const monthName=new Date().toLocaleString(undefined,{month:"long",year:"numeric"});
  const todayLvl = weeklyAvg ? levelFor(weeklyAvg) : null;

  return (
    <section style={{ padding:"0 0 40px", fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        .ins-search::placeholder { color: #b0b0b0; }
        .ins-search:focus { outline: none; border-color: ${T.violet}; box-shadow: 0 0 0 3px ${T.violetSoft}; }
        .ins-range-btn { transition: all 0.15s; }
        .ins-range-btn:hover { opacity: 0.8; }
        .ins-heat-cell { transition: transform 0.1s, box-shadow 0.1s; cursor: pointer; }
        .ins-heat-cell:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        @media (max-width: 768px) {
          .ins-grid-main { grid-template-columns: 1fr !important; }
          .ins-stat-row { grid-template-columns: repeat(2, 1fr) !important; }
          .ins-header { flex-direction: column !important; gap: 12px !important; }
          .ins-wd-row { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .ins-stat-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="ins-header" style={{
        display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        gap:16, marginBottom:24, flexWrap:"wrap",
      }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.violet, marginBottom:4 }}>
            Your Dashboard
          </div>
          <h2 style={{
            fontSize:28, fontWeight:700, margin:"0 0 4px",
            fontFamily:"'DM Serif Display', Georgia, serif",
            color:"#868686", lineHeight:1.15,
          }}>
            Mood Insights
          </h2>
          <p style={{ margin:0, fontSize:13.5, color:T.inkSoft, lineHeight:1.5 }}>
            A clear picture of your emotional health and journaling habits
          </p>
        </div>
        <div style={{ position:"relative", flexShrink:0 }}>
          <input
            className="ins-search"
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search entries…"
            style={{
              width:200, padding:"9px 12px 9px 34px",
              fontSize:13, borderRadius:T.r,
              border:`1.5px solid ${T.border}`,
              background:T.card, color:T.ink,
              transition:"border-color 0.15s, box-shadow 0.15s",
            }}
          />
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:14, color:T.inkFade, pointerEvents:"none" }}>⌕</span>
        </div>
      </div>

      {/* ── Search results ── */}
      {searchQ.trim() && (
        <Card style={{ marginBottom:20 }}>
          <CardPad>
            <Label>Results for "{searchQ}"</Label>
            {searchResults.length===0
              ? <div style={{ fontSize:13, color:T.inkFade }}>No matches found.</div>
              : searchResults.map(group=>(
                <div key={group.date} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.inkSoft, marginBottom:8, letterSpacing:"0.05em" }}>{group.date}</div>
                  {group.items.map(it=>(
                    <div key={it.id} style={{
                      padding:"10px 12px", borderRadius:T.r,
                      background:T.paper, marginBottom:6, border:`1px solid ${T.borderSoft}`,
                    }}>
                      <div style={{ fontSize:11, fontWeight:600, color:levelFor(scoreEntry(it)).color, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                        {it.mood||"—"} · {levelFor(scoreEntry(it)).label}
                      </div>
                      <div style={{ fontSize:13, color:T.ink, lineHeight:1.6 }}
                        dangerouslySetInnerHTML={{ __html:(it.text||"").replace(new RegExp(searchQ.trim(),"ig"),m=>`<mark style="background:#fef08a;border-radius:2px;padding:0 2px">${m}</mark>`) }}
                      />
                    </div>
                  ))}
                </div>
              ))
            }
          </CardPad>
        </Card>
      )}

      {/* ── Stat pills ── */}
      <div className="ins-stat-row" style={{
        display:"grid", gridTemplateColumns:"repeat(4, 1fr)",
        gap:12, marginBottom:20,
      }}>
        <StatPill icon="◐" label="Weekly avg" value={weeklyAvg?`${weeklyAvg}/7`:"—"} sub={todayLvl?.label||"Add entries"} accent={todayLvl?.color||T.violet} />
        <StatPill icon="🔥" label="Streak" value={`${currentStreak}d`} sub={`Best: ${longestStreak} days`} accent={T.amber} />
        <StatPill icon="◉" label="Top emotion" value={topEmotion||"—"} sub={topEmotion?`${Math.round(((emotionFrequency[topEmotion]||0)/Math.max(1,totalEmotionCount))*100)}% this week`:""} accent={EMOTION_COLORS[topEmotion]||T.violet} />
        <StatPill icon="▣" label="Depth" value={`${reflectionStats.pct}%`} sub={`${reflectionStats.deep}/${reflectionStats.total} entries`} accent={reflectionStats.pct>=50?T.emerald:reflectionStats.pct>=25?T.amber:T.rose} />
      </div>

      {/* ── Main grid ── */}
      <div className="ins-grid-main" style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(0,300px)", gap:16 }}>

        {/* LEFT col */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Trend chart */}
          <Card>
            <CardPad>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                <Label style={{ marginBottom:0 }}>Emotional Trend</Label>
                <div style={{ display:"flex", gap:6 }}>
                  {[["week","Week"],["month","Month"]].map(([r,lbl])=>(
                    <button key={r} className="ins-range-btn" onClick={()=>setChartRange(r)} style={{
                      padding:"5px 12px", fontSize:12, borderRadius:8,
                      border:`1.5px solid ${chartRange===r?T.violet:T.border}`,
                      background: chartRange===r?T.violet:"transparent",
                      color: chartRange===r?"#fff":T.inkSoft,
                      cursor:"pointer", fontWeight:600, fontFamily:"inherit",
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div style={{ width:"100%", height:210 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={T.violet} />
                        <stop offset="100%" stopColor={T.sky} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderSoft} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize:11, fill:T.inkFade, fontFamily:"inherit" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0,7]} ticks={[1,3,5,7]} tick={{ fontSize:11, fill:T.inkFade, fontFamily:"inherit" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={2.5}
                      dot={{ r:3.5, fill:T.violet, strokeWidth:2, stroke:"#fff" }}
                      activeDot={{ r:5, fill:T.violet, strokeWidth:2, stroke:"#fff" }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {(weekDelta!=null||bestDay) && (
                <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:10, paddingTop:10, borderTop:`1px solid ${T.borderSoft}` }}>
                  {weekDelta!=null && (
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{
                        fontSize:12, fontWeight:700,
                        color:weekDelta>=0?T.emerald:T.rose,
                        background:weekDelta>=0?T.emeraldSoft:T.roseSoft,
                        padding:"2px 8px", borderRadius:99,
                      }}>{weekDelta>=0?"↑":"↓"} {Math.abs(weekDelta)}%</span>
                      <span style={{ fontSize:12, color:T.inkSoft }}>vs last week</span>
                    </div>
                  )}
                  {bestDay && <span style={{ fontSize:12, color:T.inkSoft }}>Best: <strong style={{ color:T.ink }}>{bestDay[0]}</strong> ({bestDay[1]}/7)</span>}
                  {worstDay && <span style={{ fontSize:12, color:T.inkSoft }}>Rough: <strong style={{ color:T.ink }}>{worstDay[0]}</strong> ({worstDay[1]}/7)</span>}
                </div>
              )}
            </CardPad>
          </Card>

          {/* Heatmap */}
          <Card>
            <CardPad>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:6 }}>
                <Label style={{ marginBottom:0 }}>{monthName}</Label>
                <span style={{ fontSize:11, color:T.inkFade }}>Tap a day to view</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
                  <div key={d} style={{ textAlign:"center", fontSize:10, color:T.inkFade, fontWeight:600, padding:"2px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                {monthlyHeatmap.map((c,idx)=>{
                  const lvl=c.score?LEVELS[clamp(Math.round(c.score),1,7)-1]:null;
                  const isSel=selectedDate===c.date;
                  return (
                    <div key={idx} className="ins-heat-cell"
                      onClick={()=>setSelectedDate(isSel?null:c.date)}
                      title={`${c.date} — ${c.score?`${c.score}/7 · ${lvl?.label}`:"No entry"}`}
                      style={{
                        background: c.inMonth&&lvl?`${lvl.color}22`:T.paper,
                        border: isSel?`2px solid ${lvl?lvl.color:T.violet}`:`1px solid ${c.inMonth&&lvl?lvl.color+"40":T.borderSoft}`,
                        borderRadius:8, minHeight:38,
                        display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center",
                        opacity:c.inMonth?1:0.25,
                      }}
                    >
                      <span style={{ fontSize:11, fontWeight:600, color:c.inMonth&&lvl?lvl.color:T.inkFade }}>{c.display}</span>
                      {c.inMonth&&lvl&&<span style={{ fontSize:9, color:lvl.color, marginTop:1 }}>{c.score}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                {LEVELS.map(l=>(
                  <div key={l.v} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <MoodDot color={l.color} size={7} />
                    <span style={{ fontSize:10, color:T.inkFade }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </CardPad>
          </Card>

          {/* Day drill-down */}
          {selectedDate && (
            <Card>
              <CardPad>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <Label style={{ marginBottom:0 }}>Entries · {selectedDate}</Label>
                  <button onClick={()=>setSelectedDate(null)} style={{ fontSize:12, color:T.inkSoft, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit" }}>Close ×</button>
                </div>
                {dayScores[selectedDate] && (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:12, padding:"6px 12px", borderRadius:99, background:levelFor(dayScores[selectedDate]).color+"1a" }}>
                    <MoodDot color={levelFor(dayScores[selectedDate]).color} size={8} />
                    <span style={{ fontSize:13, fontWeight:600, color:levelFor(dayScores[selectedDate]).color }}>{dayScores[selectedDate]}/7 · {levelFor(dayScores[selectedDate]).label}</span>
                  </div>
                )}
                {(grouped[selectedDate]||[]).length===0
                  ? <div style={{ fontSize:13, color:T.inkFade }}>No entries for this day.</div>
                  : (grouped[selectedDate]||[]).map(e=>(
                    <div key={e.id} style={{ padding:"12px 14px", borderRadius:T.r, background:T.paper, marginBottom:8, border:`1px solid ${T.borderSoft}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:levelFor(scoreEntry(e)).color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{levelFor(scoreEntry(e)).label}</span>
                        {e.mood&&<span style={{ fontSize:11, color:T.inkFade }}>{e.mood}</span>}
                      </div>
                      <div style={{ fontSize:13, color:T.ink, lineHeight:1.65 }}>{e.text}</div>
                    </div>
                  ))
                }
              </CardPad>
            </Card>
          )}

          {/* Patterns */}
          <Card>
            <CardPad>
              <Label>Patterns Detected</Label>
              {patterns.map((p,i)=><PatternRow key={i} text={p.text} detail={p.detail} positive={p.positive} />)}
            </CardPad>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardPad>
              <Label>Suggestions for You</Label>
              {suggestions.map((s,i)=><SuggestionRow key={i} text={s} idx={i} />)}
            </CardPad>
          </Card>
        </div>

        {/* RIGHT col */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Pie */}
          <Card>
            <CardPad>
              <Label>Mood Distribution · This Week</Label>
              <div style={{ width:"100%", height:160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={4}>
                      {pieData.map((entry,i)=>(
                        <Cell key={i} fill={PIE_COLORS_MAP[entry.name]||"#9ca3af"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:`1px solid ${T.border}` }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop:8 }}>
                {pieData.map(p=>(
                  <div key={p.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                    <MoodDot color={PIE_COLORS_MAP[p.name]} size={10} />
                    <span style={{ fontSize:13, color:T.ink, flex:1, fontWeight:500 }}>{p.name}</span>
                    <span style={{ fontSize:12, color:T.inkSoft }}>{p.value} entries</span>
                  </div>
                ))}
              </div>
            </CardPad>
          </Card>

          {/* Emotion breakdown */}
          <Card>
            <CardPad>
              <Label>Emotion Breakdown · This Week</Label>
              {Object.keys(EMOTION_KEYWORDS).map(em=>(
                <EmotionBar key={em} name={em} count={emotionFrequency[em]||0} total={totalEmotionCount} />
              ))}
              {totalEmotionCount===0&&<div style={{ fontSize:13, color:T.inkFade }}>No entries this week.</div>}
            </CardPad>
          </Card>

          {/* Weekday vs weekend */}
          <Card>
            <CardPad>
              <Label>Weekday vs Weekend</Label>
              <div className="ins-wd-row" style={{ display:"flex", gap:8, marginBottom:10 }}>
                {[{label:"Weekdays",val:weekdayVsWeekend.weekday},{label:"Weekends",val:weekdayVsWeekend.weekend}].map(({label,val})=>{
                  const lvl=val?levelFor(val):null;
                  return (
                    <div key={label} style={{
                      flex:1, textAlign:"center", padding:"14px 8px",
                      background:lvl?`${lvl.color}12`:T.paper,
                      borderRadius:T.r, border:`1px solid ${lvl?lvl.color+"30":T.borderSoft}`,
                    }}>
                      <div style={{ fontSize:10, color:T.inkSoft, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{label}</div>
                      <div style={{ fontSize:28, fontWeight:700, color:lvl?lvl.color:T.inkFade, lineHeight:1 }}>{val??"—"}</div>
                      <div style={{ fontSize:11, color:T.inkFade, marginTop:4 }}>{lvl?"/ 7":"no data"}</div>
                    </div>
                  );
                })}
              </div>
              {weekdayVsWeekend.weekday!=null&&weekdayVsWeekend.weekend!=null&&(
                <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.5 }}>
                  {weekdayVsWeekend.weekend>weekdayVsWeekend.weekday
                    ?"Weekends lift your mood. Try to carry that energy into Mondays."
                    :"Your weekday routine supports your mood — keep it up."}
                </div>
              )}
            </CardPad>
          </Card>

          {/* Reflection depth */}
          <Card>
            <CardPad>
              <Label>Reflection Depth</Label>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{ flex:1, height:8, background:T.borderSoft, borderRadius:99, overflow:"hidden" }}>
                  <div style={{
                    width:`${reflectionStats.pct}%`, height:"100%", borderRadius:99,
                    background: reflectionStats.pct>=50?T.emerald:reflectionStats.pct>=25?T.amber:T.rose,
                    transition:"width 0.6s ease",
                  }} />
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:T.ink, minWidth:44 }}>{reflectionStats.pct}%</div>
              </div>
              <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.6 }}>
                {reflectionStats.pct>=50
                  ?"Great depth — you write with real intention."
                  :reflectionStats.pct>=25
                    ?"Some entries go deep. Try to explore the why more often."
                    :"Most entries are brief. Exploring the why behind feelings unlocks deeper clarity."}
              </div>
            </CardPad>
          </Card>

        </div>
      </div>
    </section>
  );
}