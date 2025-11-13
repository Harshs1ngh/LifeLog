import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Tasks({
  tasks,
  taskText,
  setTaskText,
  addTask,
  toggleTask,
  deleteTask,
  taskCategory,
  setTaskCategory,
  clearCompleted,
}) {
  // totals + percentage for progress circle
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  // weekly data — attempts to infer completion day from task id timestamp
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const iso = day.toISOString().split("T")[0];
      // count tasks whose done===true and whose id date equals iso (fallback)
      const completed = tasks.filter((t) => {
        if (!t.done) return false;
        try {
          const createdIso = new Date(t.id).toISOString().split("T")[0];
          return createdIso === iso;
        } catch {
          return false;
        }
      }).length;
      days.push({ day: day.toLocaleDateString(undefined, { weekday: "short" }), completed });
    }
    return days;
  }, [tasks]);

  return (
    <section className="page tasks-page tasks-modern-grid">
      {/* LEFT COLUMN */}
      <div className="tasks-left-col">
        {/* header */}
        <div className="tasks-header card">
          <div>
            <h2 className="tasks-title">Today's Tasks</h2>
            <p className="muted">Small steps every day. Build momentum.</p>
          </div>

          <div className="progress-circle" aria-hidden>
            <svg width="90" height="90" viewBox="0 0 90 90" role="img" aria-label={`Progress ${percentage} percent`}>
              <defs>
                <linearGradient id="gPrimary" x1="0" x2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
                <linearGradient id="gSuccess" x1="0" x2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>

              <circle className="bg" cx="45" cy="45" r="38" />
              <circle
                className="fg"
                cx="45"
                cy="45"
                r="38"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 - (2 * Math.PI * 38 * percentage) / 100}
                stroke={percentage === 100 ? "url(#gSuccess)" : "url(#gPrimary)"}
              />
            </svg>
            <span className="progress-text">{percentage}%</span>
          </div>
        </div>

        {/* add task card */}
        <div className="card add-task-card modern-card">
          <div className="task-input-modern">
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="What do you want to accomplish?"
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              aria-label="New task"
            />

            <div className="category-select">
              {["Work", "Personal", "Study"].map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill ${taskCategory === cat ? "active" : ""}`}
                  onClick={() => setTaskCategory(cat)}
                  aria-pressed={taskCategory === cat}
                >
                  {cat === "Work" && "💼 "}
                  {cat === "Personal" && "🏡 "}
                  {cat === "Study" && "📚 "}
                  {cat}
                </button>
              ))}
            </div>

            <div className="add-row">
              <button className="btn-add-modern" onClick={addTask} aria-label="Add task">
                Add Task
              </button>
              <div className="micro-stats muted">
                {done} completed • {total} total
              </div>
            </div>
          </div>
        </div>

        {/* task list */}
        <ul className="task-list-modern">
          {tasks.length === 0 ? (
            <div className="empty-state card">
              <p>No tasks yet — add one above ✨</p>
            </div>
          ) : (
            tasks.map((task) => (
              <li key={task.id} className={`task-item-modern card ${task.done ? "done" : ""}`}>
                <label className="task-left-modern">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    aria-label={task.done ? `Mark ${task.text} as undone` : `Mark ${task.text} as done`}
                  />
                  <div className="task-meta-modern">
                    <span className="task-title-modern">{task.text}</span>
                    <span className="task-cat">{task.category}</span>
                  </div>
                </label>

                <div className="task-actions-modern">
                  <button className="task-delete-modern" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.text}`}>
                    🗑️
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* footer */}
        <div className="tasks-footer-modern">
          <button className="clear-btn-modern" onClick={clearCompleted}>Clear Completed</button>
          <div className="muted tasks-footer-right">{done} completed • {total} total</div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <aside className="tasks-right-col">
        <div className="card quick-actions-card">
          <h4>Quick Actions</h4>
          <button className="ghost" onClick={() => {
            const samples = [
              { id: Date.now()+1, text: "Inbox zero: clear emails", done: false, category: "Work" },
              { id: Date.now()+2, text: "20 min study session", done: false, category: "Study" },
            ];
            // NOTE: this uses the parent's setTasks via callback — invoking sample addition via DOM is okay because App holds logic
            // We can't call setTasks here (not passed) so user kept earlier sample button logic in App.jsx; keep this as a hint button (no-op)
            alert("Use Quick Actions in the main UI to add sample tasks (or click 'Add sample tasks' in the original right panel).");
          }}>Add sample tasks</button>

          <hr />

          <h4>Tips</h4>
          <ul className="tips">
            <li>Break big tasks into smaller chunks</li>
            <li>Limit yourself to 3 MITs (Most Important Tasks)</li>
            <li>Use category pills to group tasks</li>
          </ul>
        </div>

        <div className="weekly-chart card">
          <h4>Weekly Productivity</h4>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </aside>
    </section>
  );
}
