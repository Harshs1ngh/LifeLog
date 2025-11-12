import React, { useState, useEffect } from "react";
import "./index.css";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts";

import {
  Book,
  BarChart2,
  Brain,
  CheckCircle,
  Moon,
  Sun,
  Smile,
  Frown,
  Meh,
} from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState("journal");
  const [todayText, setTodayText] = useState("");
  const [entries, setEntries] = useState([]);
  const [mood, setMood] = useState(null);
  const API = "http://127.0.0.1:8000";
const [tasks, setTasks] = useState([]);
const [taskText, setTaskText] = useState("");
const [taskCategory, setTaskCategory] = useState("Work");

// Load tasks
useEffect(() => {
  const saved = JSON.parse(localStorage.getItem("tasks")) || [];
  setTasks(saved);
}, []);

// Save tasks
useEffect(() => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}, [tasks]);

// Add new task
const addTask = () => {
  if (!taskText.trim()) return;
  const newTask = {
    id: Date.now(),
    text: taskText,
    done: false,
    category: taskCategory,
  };
  setTasks([newTask, ...tasks]);
  setTaskText("");
};

// Toggle task
const toggleTask = (id) => {
  setTasks(
    tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
  );
};

// Delete task
const deleteTask = (id) => {
  setTasks(tasks.filter((t) => t.id !== id));
};

// Clear completed
const clearCompleted = () => {
  setTasks(tasks.filter((t) => !t.done));
};

  // Load saved entries
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("entries")) || [];
    setEntries(saved);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
  }, [entries]);

  // Analyze mood and save entry
const saveEntry = async () => {
  if (!todayText.trim()) return;
  try {
    const res = await axios.post(`${API}/analyze`, { text: todayText });
    const moodData = res.data?.mood || "Neutral";

    const now = new Date();
    const newEntry = {
      id: Date.now(),
      date: now.toLocaleString(), // for display
      dateOnly: now.toISOString().split("T")[0], // consistent daily check
      text: todayText,
      mood: moodData,
    };

    setEntries([newEntry, ...entries]);
    setMood(moodData);
    setTodayText("");
  } catch (err) {
    console.error(err);
    setMood("Neutral");
  }
};

  const deleteEntry = (id) => {
  const updated = entries.filter((e) => e.id !== id);
  setEntries(updated);
};


  const moodIcon = (m) => {
    switch (m) {
      case "Happy":
        return <Smile color="#22c55e" size={22} />;
      case "Sad":
        return <Frown color="#ef4444" size={22} />;
      default:
        return <Meh color="#94a3b8" size={22} />;
    }
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">LifeLog</h2>
        <nav>
          <button onClick={() => setPage("journal")}>
            <Book /> Journal
          </button>
          <button onClick={() => setPage("tasks")}>
            <CheckCircle /> Tasks
          </button>
          <button onClick={() => setPage("analytics")}>
            <BarChart2 /> Insights
          </button>
          <button onClick={() => setPage("lifecard")}>
            <Brain /> LifeCard
          </button>
        </nav>
        <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun /> : <Moon />}
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="dashboard">
        <header>
          <h1>
            {page === "journal"
              ? "My Journal 📔"
              : page === "tasks"
              ? "Today's Tasks ✅"
              : page === "analytics"
              ? "Mood Insights 📊"
              : "LifeCard 🧠"}
          </h1>
          <p>{new Date().toLocaleDateString()}</p>
        </header>

        <section className="content-area">
          {/* Journal Section */}
{page === "journal" ? (
  <>
    {/* Daily Summary Card */}
    <div className="daily-summary">
      <div>
        <h3>Today’s Mood</h3>
        <p>{mood ? mood : "Not analyzed yet"}</p>
      </div>
      <div>
        <h3>Entries Today</h3>
        <p>
          {entries.filter(
            (e) => e.dateOnly === new Date().toISOString().split("T")[0]
          ).length || 0}
        </p>
      </div>
      <div>
        <h3>Word Count</h3>
        <p>{todayText.trim().split(/\s+/).filter(Boolean).length}</p>
      </div>
    </div>

    {/* Inspirational Quote */}
    <div className="quote-card">
      <p>
        {mood === "Happy"
          ? "Keep this energy flowing, Harsh 🌞"
          : mood === "Sad"
          ? "It’s okay to rest your heart. Tomorrow is brighter 💫"
          : "Small steps today build strong tomorrows 🌱"}
      </p>
    </div>

    {/* Main Journal Input */}
    <h2>How are you feeling today?</h2>

    <div className="mood-bar">
      {mood && (
        <div className="mood-display">
          {moodIcon(mood)} <span>{mood}</span>
        </div>
      )}
    </div>

    <textarea
      placeholder="Write your thoughts..."
      value={todayText}
      onChange={(e) => setTodayText(e.target.value)}
    />

    <div className="journal-actions">
      <button onClick={saveEntry} className="save-btn">
        Save Entry 💾
      </button>
    </div>

    {/* Entries History */}
    <div className="entries">
      {entries.map((entry) => {
        const todayDate = new Date().toISOString().split("T")[0];
        const isToday = entry.dateOnly === todayDate;

        return (
          <div
            key={entry.id}
            className={`entry-card mood-${entry.mood?.toLowerCase()}`}
          >
            <div className="entry-header">
              <span>{entry.date}</span>
              <div className="entry-actions">
                {moodIcon(entry.mood)}
                {isToday && (
                  <button
                    className="delete-btn"
                    onClick={() => deleteEntry(entry.id)}
                    title="Delete this entry"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            <p>{entry.text}</p>
            <small>
              Mood: {entry.mood}{" "}
              {!isToday && <span className="locked">(locked)</span>}
            </small>
          </div>
        );
      })}
    </div>
  </>
/* --- Tasks Page JSX: paste where you render pages (replace old tasks block) --- */
) : page === "tasks" ? (
  <>
    <div className="tasks-shell">
      <div className="tasks-left">
        <div className="tasks-top">
          <div>
            <h2>Today's Tasks</h2>
            <p className="muted">Focus on what matters — small steps daily</p>
          </div>

          {/* Circular progress */}
          <div className="progress-wrap" aria-hidden>
            {(() => {
              const done = tasks.filter((t) => t.done).length;
              const total = tasks.length || 1;
              const pct = Math.round((done / total) * 100);
              const stroke = 28;
              const r = 36;
              const c = 2 * Math.PI * r;
              const dash = Math.max(0, Math.min(c * (pct / 100), c));
              return (
                <svg className="progress-ring" width="92" height="92" viewBox="0 0 92 92">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                  <g transform="translate(46,46)">
                    <circle r={r} fill="transparent" stroke="#eef2ff" strokeWidth={stroke} />
                    <circle
                      r={r}
                      fill="transparent"
                      stroke="url(#g1)"
                      strokeWidth={stroke}
                      strokeDasharray={`${dash} ${c - dash}`}
                      strokeLinecap="round"
                      transform="rotate(-90)"
                    />
                    <text textAnchor="middle" dy="6" fontSize="14" fill="#111827" className="progress-text">
                      {done}/{tasks.length || 0}
                    </text>
                  </g>
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Add task */}
        <div className="task-input-row">
          <input
            type="text"
            placeholder="Add a task (e.g. Finish README)"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <div className="select-and-add">
            <div className="category-pill-group">
              <button
                className={`pill ${taskCategory === "Work" ? "active" : ""}`}
                onClick={() => setTaskCategory("Work")}
              >
                💼 Work
              </button>
              <button
                className={`pill ${taskCategory === "Personal" ? "active" : ""}`}
                onClick={() => setTaskCategory("Personal")}
              >
                🏡 Personal
              </button>
              <button
                className={`pill ${taskCategory === "Study" ? "active" : ""}`}
                onClick={() => setTaskCategory("Study")}
              >
                📚 Study
              </button>
            </div>

            <button className="btn-add" onClick={addTask} aria-label="Add task">Add</button>
          </div>
        </div>

        {/* Task list */}
        <ul className="task-list">
          {tasks.length === 0 ? (
            <li className="empty">No tasks yet — add one above ✨</li>
          ) : (
            tasks.map((task) => (
              <li key={task.id} className={`task-row ${task.done ? "done" : ""}`}>
                <label className="task-left">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="task-check"
                  />
                  <div className="task-meta">
                    <span className="task-title">{task.text}</span>
                    <span className="task-sub muted">{task.category}</span>
                  </div>
                </label>

                <div className="task-actions">
                  <button
                    className="small-delete"
                    onClick={() => deleteTask(task.id)}
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="tasks-footer">
          <button className="btn-clear" onClick={clearCompleted}>Clear completed</button>
          <small className="muted">{tasks.filter(t => t.done).length} completed • {tasks.length} total</small>
        </div>
      </div>

      {/* Right column — helpful tips & quick actions */}
      <aside className="tasks-right">
        <div className="info-card">
          <h4>Quick Actions</h4>   
          <button className="ghost" onClick={() => {
            // smart quick-add sample tasks (keeps logic intact)
            const samples = [
              { id: Date.now()+1, text: "Inbox zero: clear emails", done: false, category: "Work" },
              { id: Date.now()+2, text: "20 min study session", done: false, category: "Study" },
            ];
            setTasks([...samples, ...tasks]);
          }}>Add sample tasks</button>

          <hr/>

          <h4>Tips</h4>
          <ul className="tips">
            <li>Mark a task done with the checkbox</li>
            <li>Click a category to quickly filter (UI filter coming next)</li>
            <li>Start small — 3 tasks a day is powerful</li>
          </ul>
        </div>
      </aside>
    </div>
  </>
  ) : page === "analytics" ? (
  <>
    <div className="insights-container">
      <h2>Mood Insights 📊</h2>
      <p className="insight-sub">
        A reflection of your emotions and productivity over time.
      </p>

      {/* ====================== 1️⃣ CONSISTENCY TRACKER ====================== */}
      <div className="consistency-section">
        <h3>1-Year Consistency Tracker 🟩</h3>
        <p className="muted">Your journaling activity throughout this year</p>

        <div className="heatmap-container">
          {/* Month Labels */}
          <div className="month-labels">
            {[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ].map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>

          {/* Heatmap Grid */}
<div className="heatmap-grid">
  {(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Start from January 1 of this year
    const start = new Date(currentYear, 0, 1);
    // End at December 31 of this year
    const end = new Date(currentYear, 11, 31);

    // Align to start on Sunday (like GitHub layout)
    start.setDate(start.getDate() - start.getDay());
    // Align end to Saturday (complete last week)
    end.setDate(end.getDate() + (6 - end.getDay()));

    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split("T")[0];
      const entry = entries.find((e) => e.dateOnly === iso);
      let level = 0;

      if (entry) {
        const wc = entry.text.trim().split(/\s+/).length;
        if (wc > 100) level = 4;
        else if (wc > 50) level = 3;
        else if (wc > 20) level = 2;
        else level = 1;
        if (entry.mood === "Sad") level = Math.max(1, level - 1);
      } else if (d > today) {
        level = -1; // future day (gray)
      }

      days.push({
        date: iso,
        level,
        month: d.getMonth(),
        week: Math.floor((d - start) / (7 * 24 * 60 * 60 * 1000)),
        dayOfWeek: d.getDay(),
      });
    }

    return days.map((d, i) => {
      const prevMonth = i > 0 ? days[i - 1].month : d.month;
      const monthChange = d.month !== prevMonth;

      return (
        <div
          key={i}
          className={`heatmap-cell ${d.level === -1 ? "future" : `level-${d.level}`} ${
            monthChange ? "month-marker" : ""
          }`}
          title={`${new Date(d.date).toDateString()} — ${
            d.level > 0 ? "Active" : d.level === 0 ? "No entry" : "Upcoming"
          }`}
        />
      );
    });
  })()}
</div>


        </div>

        {/* Stats */}
        <div className="consistency-stats">
          {(() => {
            const activeDays = entries.length;
            const streak = (() => {
              let count = 0;
              let date = new Date();
              while (entries.some(e => e.dateOnly === date.toISOString().split("T")[0])) {
                count++;
                date.setDate(date.getDate() - 1);
              }
              return count;
            })();

            return (
              <>
                <div className="stat">
                  <span>🔥 Current Streak</span>
                  <strong>{streak} day{streak !== 1 ? "s" : ""}</strong>
                </div>
                <div className="stat">
                  <span>✅ Total Active Days</span>
                  <strong>{activeDays}</strong>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ====================== 2️⃣ MOOD SUMMARY ====================== */}
      <div className="stats-cards">
        <div className="stat-card happy">
          <h3>😊 Happy Days</h3>
          <p>{entries.filter((e) => e.mood === "Happy").length}</p>
        </div>
        <div className="stat-card neutral">
          <h3>😐 Neutral Days</h3>
          <p>{entries.filter((e) => e.mood === "Neutral").length}</p>
        </div>
        <div className="stat-card sad">
          <h3>😢 Sad Days</h3>
          <p>{entries.filter((e) => e.mood === "Sad").length}</p>
        </div>
      </div>

      {/* ====================== 3️⃣ CHARTS SIDE BY SIDE ====================== */}
      <div className="charts-row">
        <div className="chart-section">
          <h3>Mood Distribution</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={[
                { name: "Happy", value: entries.filter(e => e.mood === "Happy").length },
                { name: "Neutral", value: entries.filter(e => e.mood === "Neutral").length },
                { name: "Sad", value: entries.filter(e => e.mood === "Sad").length },
              ]}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              <Cell fill="#22c55e" />
              <Cell fill="#94a3b8" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="chart-section">
          <h3>Mood Over Time</h3>
          <LineChart
            width={400}
            height={250}
            data={entries.slice(0, 10).reverse().map(e => ({
              name: e.date.split(",")[0],
              moodScore: e.mood === "Happy" ? 2 : e.mood === "Neutral" ? 1 : 0,
            }))}
          >
            <XAxis dataKey="name" />
            <YAxis
              ticks={[0, 1, 2]}
              tickFormatter={(v) =>
                v === 2 ? "Happy" : v === 1 ? "Neutral" : "Sad"
              }
            />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="moodScore"
              stroke="#6366f1"
              strokeWidth={3}
            />
          </LineChart>
        </div>
      </div>

      {/* ====================== 4️⃣ AI INSIGHT ====================== */}
      <div className="ai-insight">
        {(() => {
          const happy = entries.filter((e) => e.mood === "Happy").length;
          const sad = entries.filter((e) => e.mood === "Sad").length;
          const total = entries.length;
          const moodRatio = total ? (happy / total) * 100 : 0;

          if (moodRatio > 70)
            return "You’ve been radiating positivity lately 🌞 Keep it up!";
          else if (moodRatio < 40)
            return "You've faced some tough days 💭 but resilience defines you.";
          else
            return "Balanced emotions ⚖️ — steady growth ahead!";
        })()}
      </div>
    </div>
  </>

) : (
  <div className="placeholder">
    <p>This section will soon show {page} UI.</p>
  </div>
)}


        </section>
      </main>
    </div>
  );
}
