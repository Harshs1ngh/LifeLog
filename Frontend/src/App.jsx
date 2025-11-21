import React, { useState, useEffect } from "react";
import "./index.css";
import axios from "axios";

import Header from "./components/header";
import Journal from "./components/journal"; 
import Insights from "./components/insight";
import LifeCard from "./components/lifelogs";

export default function App() {

  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState("journal");

  const [entries, setEntries] = useState([]); 
  const [todayText, setTodayText] = useState("");
  const [mood, setMood] = useState(null);

  const API = "http://127.0.0.1:8000"; 

  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tasks")) || [];
    } catch {
      return [];
    }
  });

  const [taskText, setTaskText] = useState("");
  const [taskCategory, setTaskCategory] = useState("Work");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: taskText,
      done: false,
      category: taskCategory
    };
    setTasks([newTask, ...tasks]);
    setTaskText("");
  };

  const toggleTask = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id) =>
    setTasks(tasks.filter((t) => t.id !== id));

  const clearCompleted = () =>
    setTasks(tasks.filter((t) => !t.done));
  
useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [darkMode]);

  useEffect(() => {
    const loadFromServer = async () => {
      try {
        const res = await fetch(`${API}/get_entries`);
        const data = await res.json();

        setEntries(Array.isArray(data.entries) ? data.entries : []);
      } catch (err) {
        console.error("Error loading entries:", err);
        setEntries([]); // fail-safe
      }
    };

    loadFromServer();
  }, []);


       // SAVE ENTRY
  const saveEntry = async (textOnly) => {
    if (!textOnly || !textOnly.trim()) return;

    try {
      const res = await axios.post(`${API}/analyze`, { text: textOnly });
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
        confirmed: false
      };

      setEntries((prev) => [newEntry, ...prev]);
      setTodayText("");
      setMood(moodData);

    } catch (err) {
      console.error(err);
    }
  };


      //  ADD ENTRY (WITH MEDIA)
  const addEntry = (entry) => {
    setEntries((prev) => [entry, ...prev]);
  };


      //  DELETE ENTRY
  const deleteEntry = (id) =>
    setEntries(entries.filter((e) => e.id !== id));


      //  REFRESH AFTER CONFIRM
  const refreshEntries = async () => {
    try {
      const res = await fetch(`${API}/get_entries`);
      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };


  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        page={page}
        setPage={setPage}
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
              API={API}
            />
          )}

          {page === "tasks" && (
            <Tasks
              tasks={tasks}
              taskText={taskText}
              setTaskText={setTaskText}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              taskCategory={taskCategory}
              setTaskCategory={setTaskCategory}
              clearCompleted={clearCompleted}
            />
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