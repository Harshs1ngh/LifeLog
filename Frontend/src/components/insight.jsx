import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

/*
  Insights component
  Props:
    - entries: array of { id, date, dateOnly, text, mood }
  Note: this component reads only the entries prop and does client-side analysis.
*/

// 7-level scale definitions (1..7)
const LEVELS = [
  { v: 1, label: "Bad Day", color: "#ef4444" },       
  { v: 2, label: "No Luck", color: "#f97316" },        
  { v: 3, label: "Vibing Day", color: "#38bdf8"  },        
  { v: 4, label: "Neutral", color: "#9ca3af"},     
  { v: 5, label: "Good Day", color: "#22c55e" },       
  { v: 6, label: "Great Day", color: "#4ade80" },      
  { v: 7, label: "Excellent Day", color: "#16a34a" },   
];

// small helper to clamp
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// keywords that slightly bias score
const POSITIVE_KEYWORDS = ["happy","joy","grateful","love","excited","good","great","awesome","amazing","blessed","productive","energized","hope"];
const NEGATIVE_KEYWORDS = ["sad","angry","depressed","tired","lonely","stressed","anxious","bad","upset","angst","hate","hurt","lost","down"];

// base mapping from mood string (if present) to a base score (1..7)
const moodBase = (mood) => {
  if (!mood) return 4; // neutral
  const low = mood.toLowerCase();
  if (low.includes("happy")) return 6;
  if (low.includes("neutral")) return 4;
  if (low.includes("sad")) return 2;
  // fallback
  return 4;
};

// score single entry: returns integer 1..7
function scoreEntry(entry) {
  // start from mood base
  let s = moodBase(entry.mood);

  // word-count / length importance: short entries slightly dampen
  const wc = entry.text ? entry.text.trim().split(/\s+/).filter(Boolean).length : 0;
  if (wc > 120) s += 1;
  else if (wc > 60) s += 0.5;
  else if (wc < 6) s -= 0.5;

  // keyword boosts
  const txt = (entry.text || "").toLowerCase();
  let pos = 0, neg = 0;
  POSITIVE_KEYWORDS.forEach(k => { if (txt.includes(k)) pos += 1; });
  NEGATIVE_KEYWORDS.forEach(k => { if (txt.includes(k)) neg += 1; });

  s += Math.min(2, pos * 0.6);
  s -= Math.min(2, neg * 0.8);

  // round and clamp to 1..7
  s = Math.round(s);
  return clamp(s, 1, 7);
}

// helper: group array by key (date)
const groupByDate = (arr) => {
  const out = {};
  arr.forEach(item => {
    const d = item.dateOnly || (new Date(item.date)).toISOString().split("T")[0];
    out[d] = out[d] || [];
    out[d].push(item);
  });
  return out;
};

// compute average score for a date's entries
const avgScoreForDate = (arr) => {
  if (!arr || arr.length === 0) return null;
  const sum = arr.reduce((acc, e) => acc + scoreEntry(e), 0);
  return Math.round((sum / arr.length) * 10) / 10; // one decimal
};

export default function Insights({ entries }) {
  const [selectedRange, setSelectedRange] = useState("week"); // 'day' | 'week' | 'month'
  const [searchQ, setSearchQ] = useState("");
  const [selectedDate, setSelectedDate] = useState(null); // yyyy-mm-dd for daily drilldown

  // grouped entries by date for quick lookup
  const grouped = useMemo(() => groupByDate(entries || []), [entries]);

  // per-day scores (map date => average score)
  const dayScores = useMemo(() => {
    const map = {};
    Object.keys(grouped).forEach(date => {
      map[date] = avgScoreForDate(grouped[date]);
    });
    return map;
  }, [grouped]);

  // compute streaks (consecutive days with an entry)
  const streaks = useMemo(() => {
    const dates = Object.keys(grouped).sort(); // ascending
    if (dates.length === 0) return { current: 0, longest: 0, weekCounts: [] };

    // make a set for quick lookup
    const set = new Set(dates);
    // current streak: count back from today
    let current = 0;
    let dt = new Date();
    while (set.has(dt.toISOString().split("T")[0])) {
      current++;
      dt.setDate(dt.getDate() - 1);
    }

    // longest streak calculation
    let longest = 0;
    let i = 0;
    while (i < dates.length) {
      let count = 1;
      let a = new Date(dates[i]);
      let j = i + 1;
      while (j < dates.length) {
        const b = new Date(dates[j]);
        const diff = (b - a) / (24 * 3600 * 1000);
        if (diff === 1) {
          count++;
          a = b;
          j++;
        } else {
          break;
        }
      }
      longest = Math.max(longest, count);
      i = j;
    }

    // weekly counts (last 7 days)
    const weekCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      weekCounts.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), count: (grouped[iso] || []).length, iso, score: dayScores[iso] || null });
    }

    return { current, longest, weekCounts };
  }, [grouped, dayScores]);

  // helper: build weekly chart (last 7 days average scores)
  const weeklyChartData = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      arr.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        score: dayScores[iso] || 0,
        count: (grouped[iso] || []).length,
        iso,
      });
    }
    return arr;
  }, [dayScores, grouped]);

  // monthly heatmap data: for current month
  const monthlyHeatmap = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // last day of month
    // align start to Sunday for grid
    const grid = [];
    const startSunday = new Date(start);
    startSunday.setDate(start.getDate() - start.getDay());
    for (let d = new Date(startSunday); d <= end || d.getDay() !== 6; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split("T")[0];
      const score = dayScores[iso] || 0;
      grid.push({ date: iso, display: d.getDate(), score, inMonth: d.getMonth() === month });
      if (d > end && d.getDay() === 6) break;
    }
    return grid;
  }, [dayScores]);

  // pie data (distribution for selected range)
  const pieData = useMemo(() => {
    let sliceDates = [];
    if (selectedRange === "day") {
      const iso = selectedDate || new Date().toISOString().split("T")[0];
      sliceDates = [iso];
    } else if (selectedRange === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        sliceDates.push(d.toISOString().split("T")[0]);
      }
    } else {
      // month
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      const days = new Date(y, m + 1, 0).getDate();
      for (let i = 1; i <= days; i++) {
        const iso = new Date(y, m, i).toISOString().split("T")[0];
        sliceDates.push(iso);
      }
    }

    // counts happy/neutral/sad by scanning entries on those dates
    const counts = { Happy: 0, Neutral: 0, Sad: 0, Other: 0 };
    sliceDates.forEach(d => {
      (grouped[d] || []).forEach(e => {
        const m = (e.mood || "Neutral").toLowerCase();
        if (m.includes("happy")) counts.Happy++;
        else if (m.includes("sad")) counts.Sad++;
        else if (m.includes("neutral")) counts.Neutral++;
        else counts.Other++;
      });
    });

    return [
      { name: "Happy", value: counts.Happy },
      { name: "Neutral", value: counts.Neutral },
      { name: "Sad", value: counts.Sad },
      { name: "Other", value: counts.Other },
    ];
  }, [selectedRange, selectedDate, grouped]);

  // AI summary: week vs previous week & month trend
  const aiSummary = useMemo(() => {
    // weekly avg this week and last week
    const getAvg = (daysBackStart, daysBackEnd) => {
      const vals = [];
      for (let i = daysBackStart; i <= daysBackEnd; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split("T")[0];
        if (dayScores[iso]) vals.push(dayScores[iso]);
      }
      if (vals.length === 0) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    const thisWeekAvg = getAvg(0, 6);
    const lastWeekAvg = getAvg(7, 13);
    const delta = (thisWeekAvg && lastWeekAvg) ? Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100) : null;

    const thisMonthAvg = (() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const days = new Date(y, m + 1, 0).getDate();
      const vals = [];
      for (let i = 1; i <= days; i++) {
        const iso = new Date(y, m, i).toISOString().split("T")[0];
        if (dayScores[iso]) vals.push(dayScores[iso]);
      }
      if (vals.length === 0) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    })();

    // textual summaries
    const lines = [];
    if (thisWeekAvg != null) {
      lines.push(`This week your average emotional score is ${thisWeekAvg.toFixed(1)} / 7.`);
      if (delta != null) {
        if (delta > 8) lines.push(`Nice improvement — up ${delta}% vs last week.`);
        else if (delta < -8) lines.push(`Mood dipped ${Math.abs(delta)}% compared to last week.`);
        else lines.push(`Mood is roughly steady compared to last week.`);
      }
    } else {
      lines.push(`Not enough data to analyze this week yet.`);
    }

    if (thisMonthAvg != null) {
      lines.push(`This month average: ${thisMonthAvg.toFixed(1)} / 7.`);
    }

    // highest and lowest days (if any)
    const scoredDates = Object.entries(dayScores).filter(([, v]) => v != null);
    if (scoredDates.length > 0) {
      const sorted = scoredDates.sort((a, b) => b[1] - a[1]);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      lines.push(`Best day: ${best[0]} (${best[1]}/7). Worst day: ${worst[0]} (${worst[1]}/7).`);
    }

    return lines.join(" ");
  }, [dayScores]);

  // search results
  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    const matched = entries.filter(e => {
      const txt = (e.text || "").toLowerCase();
      const mood = (e.mood || "").toLowerCase();
      return txt.includes(q) || mood.includes(q);
    });
    // group by date
    const groupedRes = {};
    matched.forEach(m => {
      const d = m.dateOnly || new Date(m.date).toISOString().split("T")[0];
      groupedRes[d] = groupedRes[d] || [];
      groupedRes[d].push(m);
    });
    // turn into array sorted desc
    return Object.keys(groupedRes).sort((a,b)=>b.localeCompare(a)).map(date => ({ date, items: groupedRes[date] }));
  }, [searchQ, entries, grouped]);

  // helper to map numeric score to LEVELS item
  const levelFor = (score) => {
    if (score == null) return LEVELS[2]; // neutral
    const idx = clamp(Math.round(score) - 1, 0, LEVELS.length - 1);
    return LEVELS[idx];
  };

  // color legend
  const legend = LEVELS.slice().reverse();

  // month name for title
  const monthName = new Date().toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="page insights-page modern-insights">
      <div className="insights-top row">
        <div className="insights-left">
          <h2>Mood Insights</h2>
          <p className="muted">Overview of your emotional health and journaling consistency.</p>
        </div>

        <div className="insights-right">
          <div className="search-box">
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search your entries or mood (e.g. 'sad', 'grateful')"
              aria-label="Search entries"
            />
          </div>
        </div>
      </div>

      {/* top stats row */}
      <div className="insights-stats row">
        <div className="card stat-large">
          <h4>Daily Streak</h4>
          <div className="streak-row">
            <div className="streak-counter">
              <div className="streak-number">{streaks.current}</div>
              <div className="streak-label">Current streak (days)</div>
            </div>
            <div className="streak-counter">
              <div className="streak-number">{streaks.longest}</div>
              <div className="streak-label">Longest streak</div>
            </div>

            <div className="weekly-sparklines">
              {streaks.weekCounts.map((w) => {
                const lvl = w.score || 0;
                const color = lvl ? levelFor(lvl).color : "#e6eef7";
                return (
                  <div key={w.iso} className="spark-bar">
                    <div className="spark" style={{ height: `${Math.min(100, (w.score || 0) / 7 * 100)}%`, background: color }} title={`${w.day}: ${w.count} entries`} />
                    <small className="muted">{w.day.slice(0,2)}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card stat-mini">
          <h4>Weekly Avg</h4>
          <div className="big">{(() => {
            const vals = weeklyChartData.map(d => d.score).filter(Boolean);
            if (!vals.length) return "—";
            const avg = Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10)/10;
            return `${avg} / 7`;
          })()}</div>
          <small className="muted">Based on entries</small>
        </div>

        <div className="card stat-mini">
          <h4>Summary</h4>
          <div className="muted small">{aiSummary}</div>
        </div>
      </div>

      {/* main content: charts + heatmap + pie */}
      <div className="insights-main row">
        <div className="left-column">
          {/* weekly line chart */}
          <div className="card chart-card">
            <div className="chart-header">
              <h4>Weekly Emotional Trend</h4>
              <div className="range-controls">
                <button className={`chip ${selectedRange === "week" ? "active" : ""}`} onClick={() => setSelectedRange("week")}>Week</button>
                <button className={`chip ${selectedRange === "month" ? "active" : ""}`} onClick={() => setSelectedRange("month")}>Month</button>
                <button className={`chip ${selectedRange === "day" ? "active" : ""}`} onClick={() => setSelectedRange("day")}>Day</button>
              </div>
            </div>

            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0,7]} ticks={[0,1,2,3,4,5,6,7]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* monthly heatmap */}
          <div className="card heatmap-card">
            <div className="heatmap-header">
              <h4>{monthName} — Daily Mood Heatmap</h4>
              <small className="muted">Green → Red (Excellent → Bad)</small>
            </div>

            <div className="heatmap-grid modern-heatmap">
              {monthlyHeatmap.map((c, idx) => {
                const level = c.score ? clamp(Math.round(c.score),1,7) : 0;
                const color = level ? LEVELS[level-1].color : "#e6eef7";
                return (
                  <div
                    key={idx}
                    className={`heat-cell ${c.inMonth ? "" : "muted-cell"} ${selectedDate === c.date ? "selected" : ""}`}
                    style={{ background: c.inMonth ? color : "#f3f4f6", borderColor: c.inMonth ? "transparent" : "transparent" }}
                    title={`${c.date} — ${c.score ? `${c.score}/7` : "No entry"}`}
                    onClick={() => setSelectedDate(c.date)}
                  >
                    <span className="cell-day">{c.display}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* daily drilldown if selected */}
          {selectedDate && (
            <div className="card daily-drill">
              <h4>Details for {selectedDate}</h4>
              <div className="muted">Avg score: {dayScores[selectedDate] || "—"}</div>
              <div className="entries-list">
                {(grouped[selectedDate] || []).map((e) => (
                  <div key={e.id} className="entry-row">
                    <div className="entry-time">{e.date.split(",")[1] || ""}</div>
                    <div className="entry-body">
                      <div className="entry-mood-pill" style={{ background: levelFor(scoreEntry(e)).color }}>
                        {levelFor(scoreEntry(e)).label}
                      </div>
                      <div className="entry-text-preview">{e.text}</div>
                      <div className="entry-meta muted">Mood: {e.mood || "—"}</div>
                    </div>
                  </div>
                ))}
                {(!grouped[selectedDate] || grouped[selectedDate].length === 0) && <div className="muted">No entries for this day.</div>}
              </div>
            </div>
          )}
        </div>

        <aside className="right-column">
          {/* pie distribution */}
          <div className="card pie-card">
            <h4>Mood Distribution ({selectedRange})</h4>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={60} label>
                    {pieData.map((entry, i) => {
                      const color = entry.name === "Happy" ? "#22c55e" : entry.name === "Neutral" ? "#9ca3af" : entry.name === "Sad" ? "#ef4444" : "#c7cdd6";
                      return <Cell key={`c-${i}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-small">
              {pieData.map((p) => (
                <div key={p.name} className="legend-item">
                  <span className="legend-color" style={{ background: p.name === "Happy" ? "#22c55e" : p.name === "Neutral" ? "#9ca3af" : p.name === "Sad" ? "#ef4444" : "#c7cdd6" }} />
                  <small>{p.name} — {p.value}</small>
                </div>
              ))}
            </div>
          </div>

          {/* search results (shows when searchQ) */}
          {searchQ.trim() ? (
            <div className="card search-results">
              <h4>Search results for “{searchQ}”</h4>
              {searchResults.length === 0 && <div className="muted">No matches</div>}
              {searchResults.map(group => (
                <div key={group.date} className="search-group">
                  <div className="search-group-date">{group.date}</div>
                  <ul>
                    {group.items.map(it => (
                      <li key={it.id} className="search-item">
                        <div className="search-mood">{it.mood || "—"}</div>
                        <div className="search-text" dangerouslySetInnerHTML={{ __html: it.text.replace(new RegExp(searchQ, "ig"), match => `<mark>${match}</mark>`) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="card quick-tip">
              <h4>Search tips</h4>
              <ul className="muted">
                <li>Try keywords like “sad”, “grateful”, or names.</li>
                <li>Search moods (e.g. “happy”) to find days with that mood.</li>
                <li>Click a heatmap day to inspect entries for that day.</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
