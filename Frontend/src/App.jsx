import React, { useState, useEffect } from "react";
import "./index.css";
import axios from "axios";
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
