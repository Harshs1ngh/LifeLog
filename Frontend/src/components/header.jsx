import React, { useState } from "react";

export default function Header({ darkMode, setDarkMode, page, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`topbar ${darkMode ? "dark" : ""}`}>
      <div className="topbar-inner">
        
        {/* Brand */}
        <div className="brand">LifeLog</div>

        {/* Desktop Nav */}
        <nav className="top-nav desktop-nav">
          <button className={`nav-link ${page === 'journal' ? 'active' : ''}`} onClick={() => setPage('journal')}>Journal</button>
          <button className={`nav-link ${page === 'analytics' ? 'active' : ''}`} onClick={() => setPage('analytics')}>Insights</button>
          <button className={`nav-link ${page === 'lifecard' ? 'active' : ''}`} onClick={() => setPage('lifecard')}>LifeCard</button>
        </nav>

        {/* Desktop actions */}
        <div className="top-actions desktop-actions">
          <button className="theme" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✖" : "☰"}
        </button>

      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <button className="m-link" onClick={() => { setPage('journal'); setMenuOpen(false); }}>Journal</button>
          <button className="m-link" onClick={() => { setPage('tasks'); setMenuOpen(false); }}>Tasks</button>
          <button className="m-link" onClick={() => { setPage('analytics'); setMenuOpen(false); }}>Insights</button>
          <button className="m-link" onClick={() => { setPage('lifecard'); setMenuOpen(false); }}>LifeCard</button>

          <div className="divider" />

          <button className="m-link muted">Reviews</button>
          <button className="m-link muted">Guides</button>
          <button className="m-link muted">Log In</button>
          <button className="m-link cta-mobile">Get the App</button>

          <button className="m-link" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      )}
    </header>
  );
}
