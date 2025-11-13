import React from "react";

export default function Header({ darkMode, setDarkMode, page, setPage }) {
  return (
    <header className={`topbar ${darkMode ? "dark" : ""}`}>
      <div className="topbar-inner">
        <div className="brand">LifeLog</div>

        <nav className="top-nav">
          <button className={`nav-link ${page === 'journal' ? 'active' : ''}`} onClick={() => setPage('journal')}>Journal</button>
          <button className={`nav-link ${page === 'tasks' ? 'active' : ''}`} onClick={() => setPage('tasks')}>Tasks</button>
          <button className={`nav-link ${page === 'analytics' ? 'active' : ''}`} onClick={() => setPage('analytics')}>Insights</button>
          <button className={`nav-link ${page === 'lifecard' ? 'active' : ''}`} onClick={() => setPage('lifecard')}>LifeCard</button>
        </nav>

        <div className="top-actions">
          <button className="link muted">Reviews</button>
          <button className="link muted">Guides</button>
          <button className="link muted">Log In</button>
          <button className="cta">Get the App</button>
          <button className="theme" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
        </div>
      </div>
    </header>
  );
}
