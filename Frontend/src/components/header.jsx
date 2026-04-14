import React, { useState } from "react";

export default function Header({ darkMode, setDarkMode, page, setPage, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`topbar ${darkMode ? "dark" : ""}`}>
      <div className="topbar-inner">
        <div className="brand">InnerSpace</div>

        <nav className="top-nav desktop-nav">
          <button className={`nav-link ${page === "journal" ? "active" : ""}`} onClick={() => setPage("journal")}>Journal</button>
          <button className={`nav-link ${page === "leaderboard" ? "active" : ""}`} onClick={() => setPage("leaderboard")}>Leaderboard</button>
          <button className={`nav-link ${page === "analytics" ? "active" : ""}`} onClick={() => setPage("analytics")}>Insights</button>
          <button className={`nav-link ${page === "lifecard" ? "active" : ""}`} onClick={() => setPage("lifecard")}>LifeCard</button>
        </nav>

        <div className="top-actions desktop-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user && (
            <span style={{ fontSize: 13, color: "#6b7280" }}>{user.name || user.email}</span>
          )}
          <button className="theme" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
            {darkMode ? "☀️" : "🌙"}
          </button>
          {user && (
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onLogout}>Log out</button>
          )}
        </div>

        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✖" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <button className="m-link" onClick={() => { setPage("journal"); setMenuOpen(false); }}>Journal</button>
          <button className="m-link" onClick={() => { setPage("leaderboard"); setMenuOpen(false); }}>Leaderboard</button>
          <button className="m-link" onClick={() => { setPage("analytics"); setMenuOpen(false); }}>Insights</button>
          <button className="m-link" onClick={() => { setPage("lifecard"); setMenuOpen(false); }}>LifeCard</button>
          <div className="divider" />
          <button className="m-link" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
          {user && (
            <button className="m-link" onClick={() => { onLogout(); setMenuOpen(false); }}>Log out</button>
          )}
        </div>
      )}
    </header>
  );
}
