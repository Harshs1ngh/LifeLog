// src/components/Insights.jsx
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
} from "recharts";

/*
  Cleaned & optimized Insights component
  Props:
    - entries: array of { id, date, dateOnly, text, mood, images?, audio? }
  Keeps the same UI and behaviour as your original file but:
    - Removes duplicate/unused code
    - Fixes heatmap month grid generation
    - Uses useMemo extensively for expensive computations
    - Small helper components for readability
*/

// ---- constants ----
const LEVELS = [
  { v: 1, label: "Bad Day", color: "#ef4444" },
  { v: 2, label: "No Luck", color: "#f97316" },
  { v: 3, label: "Vibing Day", color: "#38bdf8" },
  { v: 4, label: "Neutral", color: "#9ca3af" },
  { v: 5, label: "Good Day", color: "#22c55e" },
  { v: 6, label: "Great Day", color: "#4ade80" },
  { v: 7, label: "Excellent Day", color: "#16a34a" },
];

const POSITIVE_KEYWORDS = [
  "happy",
  "joy",
  "grateful",
  "love",
  "excited",
  "good",
  "great",
  "awesome",
  "amazing",
  "blessed",
  "productive",
  "energized",
  "hope",
];
const NEGATIVE_KEYWORDS = [
  "sad",
  "angry",
  "depressed",
  "tired",
  "lonely",
  "stressed",
  "anxious",
  "bad",
  "upset",
  "angst",
  "hate",
  "hurt",
  "lost",
  "down",
];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const moodBase = (mood) => {
  if (!mood) return 4;
  const low = mood.toLowerCase();
  if (low.includes("happy")) return 6;
  if (low.includes("neutral")) return 4;
  if (low.includes("sad")) return 2;
  return 4;
};

function scoreEntry(entry) {
  let s = moodBase(entry.mood);
  const wc = entry.text ? entry.text.trim().split(/\s+/).filter(Boolean).length : 0;
  if (wc > 120) s += 1;
  else if (wc > 60) s += 0.5;
  else if (wc < 6) s -= 0.5;

  const txt = (entry.text || "").toLowerCase();
  let pos = 0,
    neg = 0;
  POSITIVE_KEYWORDS.forEach((k) => {
    if (txt.includes(k)) pos += 1;
  });
  NEGATIVE_KEYWORDS.forEach((k) => {
    if (txt.includes(k)) neg += 1;
  });

  s += Math.min(2, pos * 0.6);
  s -= Math.min(2, neg * 0.8);

  s = Math.round(s);
  return clamp(s, 1, 7);
}

const groupByDate = (arr) => {
  return (arr || []).reduce((acc, item) => {
    const d = item.dateOnly || new Date(item.date).toISOString().split("T")[0];
    acc[d] = acc[d] || [];
    acc[d].push(item);
    return acc;
  }, {});
};

const avgScoreForDate = (arr) => {
  if (!arr || arr.length === 0) return null;
  const sum = arr.reduce((acc, e) => acc + scoreEntry(e), 0);
  return Math.round(((sum / arr.length) * 10)) / 10;
};

// small presentational subcomponents
function StatCard({ title, value, subtitle }) {
  return (
    <div className="card stat-mini">
      <h4>{title}</h4>
      <div className="big">{value}</div>
      {subtitle && <small className="muted">{subtitle}</small>}
    </div>
  );
}

export default function Insights({ entries = [] }) {
  const [selectedRange, setSelectedRange] = useState("week"); // 'day' | 'week' | 'month'
  const [searchQ, setSearchQ] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  // group entries by date (yyyy-mm-dd)
  const grouped = useMemo(() => groupByDate(entries), [entries]);

  // per-day average scores
  const dayScores = useMemo(() => {
    const map = {};
    Object.keys(grouped).forEach((date) => {
      map[date] = avgScoreForDate(grouped[date]);
    });
    return map;
  }, [grouped]);

  // WEEKLY chart data (last 7 days)
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

  // heatmap grid for current month (aligned to Sunday..Saturday)
  const monthlyHeatmap = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // find grid start (previous Sunday) and grid end (next Saturday)
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const grid = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split("T")[0];
      grid.push({
        date: iso,
        display: d.getDate(),
        score: dayScores[iso] || 0,
        inMonth: d.getMonth() === month,
      });
    }
    return grid;
  }, [dayScores]);

  // streaks & weekCounts
  const streaks = useMemo(() => {
    const dates = Object.keys(grouped).sort(); // ascending
    if (dates.length === 0) return { current: 0, longest: 0, weekCounts: [] };

    const setDates = new Set(dates);
    // current streak = consecutive days ending today
    let current = 0;
    let dt = new Date();
    while (setDates.has(dt.toISOString().split("T")[0])) {
      current++;
      dt.setDate(dt.getDate() - 1);
    }

    // longest streak
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
        } else break;
      }
      longest = Math.max(longest, count);
      i = j;
    }

    // last 7 days counts
    const weekCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      weekCounts.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: (grouped[iso] || []).length,
        iso,
        score: dayScores[iso] || null,
      });
    }

    return { current, longest, weekCounts };
  }, [grouped, dayScores]);

  // pie data for selected range
const pieData = useMemo(() => {
  let sliceDates = [];

  if (selectedRange === "day") {
    sliceDates.push(selectedDate || new Date().toISOString().split("T")[0]);
  } else if (selectedRange === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      sliceDates.push(d.toISOString().split("T")[0]);
    }
  } else {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) {
      sliceDates.push(new Date(y, m, i).toISOString().split("T")[0]);
    }
  }

  const counts = { Happy: 0, Neutral: 0, Sad: 0 };

  sliceDates.forEach(date => {
    (grouped[date] || []).forEach(e => {
      const score = scoreEntry(e); // 1..7 scaled
      if (score >= 5) counts.Happy++;
      else if (score === 3 || score === 4) counts.Neutral++;
      else counts.Sad++;
    });
  });

  return [
    { name: "Happy", value: counts.Happy },
    { name: "Neutral", value: counts.Neutral },
    { name: "Sad", value: counts.Sad }
  ];
}, [selectedRange, selectedDate, grouped]);

  // AI summary (week vs previous week + month)
  const aiSummary = useMemo(() => {
    const getAvg = (start, end) => {
      const vals = [];
      for (let i = start; i <= end; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split("T")[0];
        if (dayScores[iso]) vals.push(dayScores[iso]);
      }
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    const thisWeek = getAvg(0, 6);
    const lastWeek = getAvg(7, 13);
    const delta = thisWeek && lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const monthVals = [];
    for (let i = 1; i <= days; i++) {
      const iso = new Date(y, m, i).toISOString().split("T")[0];
      if (dayScores[iso]) monthVals.push(dayScores[iso]);
    }
    const monthAvg = monthVals.length ? monthVals.reduce((a, b) => a + b, 0) / monthVals.length : null;

    const parts = [];
    if (thisWeek != null) {
      parts.push(`This week avg: ${thisWeek.toFixed(1)} / 7.`);
      if (delta != null) {
        if (delta > 8) parts.push(`Up ${delta}% vs last week.`);
        else if (delta < -8) parts.push(`Down ${Math.abs(delta)}% vs last week.`);
        else parts.push(`Stable vs last week.`);
      }
    } else parts.push("Not enough data for weekly analysis.");

    if (monthAvg != null) parts.push(`Month avg: ${monthAvg.toFixed(1)} / 7.`);

    const scored = Object.entries(dayScores).filter(([, v]) => v != null);
    if (scored.length) {
      scored.sort((a, b) => b[1] - a[1]);
      parts.push(`Best day: ${scored[0][0]} (${scored[0][1]}/7). Worst day: ${scored[scored.length - 1][0]} (${scored[scored.length - 1][1]}/7).`);
    }

    return parts.join(" ");
  }, [dayScores]);

  // search results grouped by date
  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return [];
    const matched = (entries || []).filter((e) => {
      const txt = (e.text || "").toLowerCase();
      const m = (e.mood || "").toLowerCase();
      return txt.includes(q) || m.includes(q);
    });
    const byDate = matched.reduce((acc, e) => {
      const d = e.dateOnly || new Date(e.date).toISOString().split("T")[0];
      acc[d] = acc[d] || [];
      acc[d].push(e);
      return acc;
    }, {});
    return Object.keys(byDate)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({ date, items: byDate[date] }));
  }, [searchQ, entries]);

  const levelFor = (score) => {
    if (score == null) return LEVELS[3];
    const idx = clamp(Math.round(score) - 1, 0, LEVELS.length - 1);
    return LEVELS[idx];
  };

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
              placeholder="Search entries or mood (e.g. 'sad', 'grateful')"
              aria-label="Search entries"
            />
          </div>
        </div>
      </div>

      {/* top stats */}
      <div className="insights-stats row">
        <div className="card stat-large">
          <h4>Daily Streak</h4>
          <div className="streak-row" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div className="streak-counter">
              <div className="streak-number">{streaks.current}</div>
              <div className="streak-label">Current streak</div>
            </div>
            <div className="streak-counter">
              <div className="streak-number">{streaks.longest}</div>
              <div className="streak-label">Longest streak</div>
            </div>

            <div className="weekly-sparklines" style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "end" }}>
              {streaks.weekCounts.map((w) => {
                const lvl = w.score || 0;
                const color = lvl ? levelFor(lvl).color : "#e6eef7";
                return (
                  <div key={w.iso} className="spark-bar" title={`${w.day}: ${w.count} entries`}>
                    <div className="spark" style={{ height: `${Math.min(100, (w.score || 0) / 7 * 100)}%`, background: color, width: 14, borderRadius: 6 }} />
                    <small className="muted">{w.day.slice(0, 2)}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <StatCard
          title="Weekly Avg"
          value={
            (() => {
              const vals = weeklyChartData.map((d) => d.score).filter(Boolean);
              if (!vals.length) return "—";
              const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
              return `${avg} / 7`;
            })()
          }
          subtitle="Based on entries"
        />

        <StatCard title="Summary" value={aiSummary || "—"} />
      </div>

      {/* main content */}
      <div className="insights-main row" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
        <div className="left-column">
          <div className="card chart-card">
            <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  <YAxis domain={[0, 7]} ticks={[0, 1, 2, 3, 4, 5, 6, 7]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card heatmap-card" style={{ marginTop: 14 }}>
            <div className="heatmap-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4>{monthName} — Daily Mood Heatmap</h4>
              <small className="muted">Green → Red (Excellent → Bad)</small>
            </div>

            <div className="heatmap-grid modern-heatmap" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 10 }}>
              {monthlyHeatmap.map((c, idx) => {
                const level = c.score ? clamp(Math.round(c.score), 1, 7) : 0;
                const color = level ? LEVELS[level - 1].color : "#e6eef7";
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(c.date)}
                    className={`heat-cell ${c.inMonth ? "" : "muted-cell"} ${selectedDate === c.date ? "selected" : ""}`}
                    title={`${c.date} — ${c.score ? `${c.score}/7` : "No entry"}`}
                    style={{
                      background: c.inMonth ? color : "#f3f4f6",
                      borderRadius: 6,
                      padding: 6,
                      minHeight: 46,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span className="cell-day" style={{ fontSize: 13, fontWeight: 600, color: c.inMonth ? "#0f172a" : "#9ca3af" }}>{c.display}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="card daily-drill" style={{ marginTop: 14 }}>
              <h4>Details for {selectedDate}</h4>
              <div className="muted">Avg score: {dayScores[selectedDate] || "—"}</div>
              <div className="entries-list" style={{ marginTop: 8 }}>
                {(grouped[selectedDate] || []).map((e) => (
                  <div key={e.id} className="entry-row" style={{ padding: 10, borderRadius: 8, marginBottom: 8, background: "#fff" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ minWidth: 82 }}>
                        <div style={{ fontWeight: 700 }}>{levelFor(scoreEntry(e)).label}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{e.date.split(",")[1] || ""}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 6 }}>{e.text}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Mood: {e.mood || "—"}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!grouped[selectedDate] || grouped[selectedDate].length === 0) && <div className="muted">No entries for this day.</div>}
              </div>
            </div>
          )}
        </div>

        <aside className="right-column">
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

            <div className="legend-small" style={{ marginTop: 8 }}>
              {pieData.map((p) => (
                <div key={p.name} className="legend-item" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="legend-color" style={{ width: 12, height: 12, background: p.name === "Happy" ? "#22c55e" : p.name === "Neutral" ? "#9ca3af" : p.name === "Sad" ? "#ef4444" : "#c7cdd6", borderRadius: 4 }} />
                  <small>{p.name} — {p.value}</small>
                </div>
              ))}
            </div>
          </div>

          {searchQ.trim() ? (
            <div className="card search-results" style={{ marginTop: 12 }}>
              <h4>Search results for “{searchQ}”</h4>
              {searchResults.length === 0 && <div className="muted">No matches</div>}
              {searchResults.map((group) => (
                <div key={group.date} className="search-group" style={{ marginBottom: 8 }}>
                  <div className="search-group-date" style={{ fontWeight: 700 }}>{group.date}</div>
                  <ul style={{ paddingLeft: 12 }}>
                    {group.items.map((it) => (
                      <li key={it.id} className="search-item" style={{ marginBottom: 6 }}>
                        <div className="search-mood" style={{ fontWeight: 700 }}>{it.mood || "—"}</div>
                        <div className="search-text" dangerouslySetInnerHTML={{ __html: (it.text || "").replace(new RegExp(searchQ, "ig"), match => `<mark>${match}</mark>`) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="card quick-tip" style={{ marginTop: 12 }}>
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
