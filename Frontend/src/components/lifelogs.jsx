import React, { useState, useMemo } from "react";

export default function LifeCard({ entries }) {
  // Extract all unique years from entries
  const years = [...new Set(entries.map(e => new Date(e.dateOnly).getFullYear()))]
    .sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState(1);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // Group entries by month
  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.dateOnly);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [entries, selectedYear, selectedMonth]);

  // Calculate weeks in the month
  const weeks = useMemo(() => {
    const w = {};
    monthEntries.forEach(e => {
      const d = new Date(e.dateOnly);
      const weekNum = Math.ceil((d.getDate() - d.getDay() + 1) / 7);
      if (!w[weekNum]) w[weekNum] = [];
      w[weekNum].push(e);
    });
    return w;
  }, [monthEntries]);

  const selectedWeekEntries = weeks[selectedWeek] || [];

  return (
    <section className="lifecard-section">
      <h2 className="lc-title">LifeCard — Your Weekly Memory Book</h2>
      <p className="lc-sub">Browse your life week-by-week, month-by-month.</p>

      {/* FILTER BAR */}
      <div className="lc-filter">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map(y => <option key={y}>{y}</option>)}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(Number(e.target.value));
            setSelectedWeek(1);
          }}
        >
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>

        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
        >
          {Object.keys(weeks).map(w => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>

      {/* WEEK HEADER */}
      <div className="week-header">
        <h3>
          Week {selectedWeek} — {months[selectedMonth]} {selectedYear}
        </h3>
        <p className="muted">{selectedWeekEntries.length} entries</p>
      </div>

      {/* ENTRIES LIST */}
      <div className="lc-entries">
        {selectedWeekEntries.length === 0 ? (
          <p className="muted no-data">No entries for this week.</p>
        ) : (
          selectedWeekEntries.map((e) => (
            <div key={e.id} className="lc-card">
              <div className="lc-card-header">
                <div>
                  <h4>{e.date.split(",")[0]}</h4>
                  <small className="muted">{e.date.split(",")[1]}</small>
                </div>
                <span className="mood-small">{e.mood}</span>
              </div>

              <p className="lc-text">{e.text}</p>

              {/* Images */}
              {e.img && (
                <div className="lc-media">
                  <img src={e.img} alt="entry" className="lc-image" />
                </div>
              )}

              {/* Audio */}
              {e.audio && (
                <audio controls className="lc-audio">
                  <source src={e.audio} />
                </audio>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
