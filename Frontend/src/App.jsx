import React, { useState, useEffect } from "react";
import "./index.css";
import Header from "./components/header.jsx";
import Journal from "./components/journal.jsx";
import Insights from "./components/insight.jsx";
import LifeCard from "./components/lifelogs.jsx"; 
import Auth from "./components/Auth.jsx";
import { api } from "./services/api.js";
import LeaderboardPage from "./components/Leaderboard.jsx";
 
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState("journal");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; }
  });

  const [entries, setEntries] = useState([]);
  const [todayText, setTodayText] = useState("");
  const [mood, setMood] = useState(null);

  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tasks")) || []; } catch { return []; }
  });
  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState("Work");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!taskText.trim()) return;
    setTasks([{ id: Date.now(), text: taskText, done: false, category: taskCategory }, ...tasks]);
    setTaskText("");
  };
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const clearCompleted = () => setTasks(tasks.filter(t => !t.done));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Load entries from server when user is logged in
  useEffect(() => {
    if (!user) return;
    refreshEntries();
  }, [user]);

  const refreshEntries = async () => {
    try {
      const res = await api.get("/entries");
      setEntries(Array.isArray(res.data.entries) ? res.data.entries : []);
    } catch (err) {
      console.error("Error loading entries:", err);
      setEntries([]);
    }
  };

  const saveEntry = async (textOnly) => {
    if (!textOnly || !textOnly.trim()) return;
    try {
      const res = await api.post("/entries/analyze", { text: textOnly });
      const moodData = res.data?.mood || "Neutral";
      const now = new Date();
      const newEntry = {
        id: Date.now(),
        date: now.toLocaleString(),
        dateOnly: now.toISOString().split("T")[0],
        text: textOnly,
        mood: moodData,
        images: [],
        audio: null,
        confirmed: false,
      };
      setEntries(prev => [newEntry, ...prev]);
      setTodayText("");
      setMood(moodData);
    } catch (err) {
      console.error("saveEntry error:", err);
    }
  };

  const addEntry = (entry) => setEntries(prev => [entry, ...prev]);
  const deleteEntry = (id) => setEntries(entries.filter(e => e.id !== id));

  const handleAuth = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setEntries([]);
  };

  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        page={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-shell">
        <div className="container">

          {page === "journal" && (
            <Journal
              entries={entries}
              todayText={todayText}
              setTodayText={setTodayText}
              saveEntry={saveEntry}
              addEntry={addEntry}
              deleteEntry={deleteEntry}
              mood={mood}
              refreshEntries={refreshEntries}
              API={import.meta.env.VITE_API_URL}
            />
          )}


          {page === "leaderboard" && (
            <LeaderboardPage currentUser={user} />
          )}

          {page === "analytics" && (
            <Insights entries={entries} />
          )}

          {page === "lifecard" && (
            <LifeCard entries={entries} />
          )}

        </div>
      </main>
    </div>
  );
}
