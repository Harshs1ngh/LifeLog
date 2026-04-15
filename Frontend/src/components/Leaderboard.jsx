import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../services/api.js";

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

function getTier(pts) {
  if (pts >= 40) return { label: "Deep Reflection", color: "#534AB7", bg: "#EEEDFE", textColor: "#3C3489" };
  if (pts >= 25) return { label: "Good",            color: "#0F6E56", bg: "#E1F5EE", textColor: "#085041" };
  if (pts >= 15)  return { label: "Normal",          color: "#854F0B", bg: "#FAEEDA", textColor: "#633806" };
  return               { label: "Low Effort",       color: "#5F5E5A", bg: "#F1EFE8", textColor: "#444441" };
}

function initial(name) {
  return (name || "?").charAt(0).toUpperCase();
}

function getRankDisplay(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function msUntilNextHour() {
  const now  = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next - now;
}

function formatCountdown(ms) {
  if (ms <= 0) return "updating…";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s < 10 ? "0" + s : s}s`;
}

function getMondayDate() {
  const now    = new Date();
  const day    = now.getDay();
  const diff   = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff + 7);
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LeaderboardPage({ currentUser }) {
  const [board, setBoard]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [lastFetched, setLastFetched] = useState(null);
  const [countdown, setCountdown]     = useState(msUntilNextHour());

  const countdownRef = useRef(null);
  const refreshRef   = useRef(null);

  const fetchBoard = useCallback(async () => {
    setError("");
    try {
      const res  = await api.get("/leaderboard");
      const data = res.data;
      setBoard(Array.isArray(data) ? data : []);
      setLastFetched(new Date());
    } catch (err) {
      console.error("Leaderboard error:", err);
      setError("Failed to load leaderboard. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  useEffect(() => {
    const delay = msUntilNextHour();
    refreshRef.current = setTimeout(() => {
      fetchBoard();
      refreshRef.current = setInterval(fetchBoard, REFRESH_INTERVAL_MS);
    }, delay);
    return () => { clearTimeout(refreshRef.current); clearInterval(refreshRef.current); };
  }, [fetchBoard]);

  useEffect(() => {
    countdownRef.current = setInterval(() => setCountdown(msUntilNextHour()), 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const maxPts      = board.length > 0 ? Math.max(...board.map(e => e.totalPoints || 0)) : 1;
  const myEntry     = board.find(e => e.username === currentUser?.name || e.username === currentUser?.email);
  const top3        = board.slice(0, 3);
  const rest        = board.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return (
    <div style={s.centered}>
      <div style={s.spinner} />
      <p style={{ color: "#6b7280", marginTop: 16, fontSize: 14 }}>Loading leaderboard…</p>
    </div>
  );

  if (error) return (
    <div style={s.centered}>
      <p style={{ color: "#E24B4A", marginBottom: 16, fontSize: 14 }}>{error}</p>
      <button onClick={fetchBoard} style={s.retryBtn}>Retry</button>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroTitle}>🏆 Leaderboard</div>
        <div style={s.heroDate}>{today}</div>
        <div style={s.heroSub}>Weekly rankings · resets every Monday</div>
      </div>

      {/* ── Timer bar ── */}
      <div style={s.timerBar}>
        <div>
          <div style={s.timerLabel}>Next refresh in</div>
          <div style={s.timerVal}>{formatCountdown(countdown)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={s.liveDot} />
          <span style={s.liveText}>
            {lastFetched
              ? `Updated ${lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Live"}
          </span>
        </div>
        <div style={s.weekChip}>Resets {getMondayDate()}</div>
      </div>

      {/* ── Info banner ── */}
      <div style={s.infoBanner}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>⏳</span>
        <div>
          <div style={s.infoText}>Points refresh every hour</div>
          <div style={s.infoSub}>Entries you save today will appear at the next hourly refresh</div>
        </div>
      </div>

      {/* ── My rank card ── */}
      {myEntry && (() => {
        const t = getTier(myEntry.totalPoints);
        return (
          <div style={{ ...s.myCard, borderColor: t.color }}>
            <div style={{ fontSize: 32, lineHeight: 1 }}>{getRankDisplay(myEntry.rank)}</div>
            <div style={{ flex: 1 }}>
              <div style={s.myName}>
                {myEntry.username}
                <span style={s.youChip}>YOU</span>
              </div>
              <div style={s.mySub}>Rank #{myEntry.rank} · {t.label}</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: t.color, textAlign: "right" }}>
                {myEntry.totalPoints} pts
              </div>
              <div style={{ ...s.tierPill, background: t.bg, color: t.textColor, marginTop: 4 }}>
                {t.label}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Streak banner ── */}
      {currentUser?.streak > 0 && (
        <div style={s.streakBanner}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔥</span>
          <div>
            <div style={s.streakText}>{currentUser.streak}-day streak — keep it going!</div>
            <div style={s.streakSub}>Journal today to maintain your streak and earn bonus points</div>
          </div>
        </div>
      )}

      {/* ── Podium ── */}
      {top3.length > 0 && (
        <>
          <div style={s.sectionLabel}>Top 3 this week</div>
          <div style={s.podium}>
            {podiumOrder.map(entry => {
              const t      = getTier(entry.totalPoints);
              const isFirst = entry.rank === 1;
              const isMe   = entry.username === currentUser?.name || entry.username === currentUser?.email;
              return (
                <div key={entry.userId} style={{
                  ...s.podCard,
                  border: isFirst ? `1.5px solid ${t.color}` : "0.5px solid #e5e7eb",
                  transform: isFirst ? "scale(1.05)" : "scale(1)",
                  zIndex: isFirst ? 2 : 1,
                }}>
                  {isFirst && <div style={s.crown}>👑</div>}
                  <div style={{ fontSize: isFirst ? 28 : 20 }}>{getRankDisplay(entry.rank)}</div>
                  <div style={{ ...s.podAvatar, background: t.bg, color: t.textColor }}>
                    {initial(entry.username)}
                  </div>
                  <div style={s.podName}>
                    {entry.username}
                    {isMe && (
                      <span style={{ display: "block", fontSize: 10, color: t.color, fontWeight: 600, marginTop: 2 }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: t.color }}>
                    {entry.totalPoints} pts
                  </div>
                  <div style={{ ...s.tierPill, background: t.bg, color: t.textColor }}>
                    {t.label}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── List rows rank 4+ ── */}
      {rest.length > 0 && (
        <>
          <div style={s.sectionLabel}>Rankings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rest.map(entry => {
              const t    = getTier(entry.totalPoints);
              const isMe = entry.username === currentUser?.name || entry.username === currentUser?.email;
              const pct  = maxPts > 0 ? Math.round((entry.totalPoints / maxPts) * 100) : 0;
              return (
                <div key={entry.userId} style={{
                  ...s.listRow,
                  background: isMe ? t.bg : "var(--color-background-primary, #fff)",
                  border: isMe ? `1.5px solid ${t.color}` : "0.5px solid #e5e7eb",
                }}>
                  <div style={s.listRank}>#{entry.rank}</div>
                  <div style={{ ...s.listAvatar, background: t.bg, color: t.textColor }}>
                    {initial(entry.username)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={s.listName}>{entry.username}</span>
                      {isMe && <span style={s.youChip}>YOU</span>}
                    </div>
                    <div style={s.progressWrap}>
                      <div style={{ ...s.progressFill, width: `${pct}%`, background: t.color }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.color }}>
                      {entry.totalPoints} pts
                    </div>
                    <div style={{ ...s.tierPill, background: t.bg, color: t.textColor, marginTop: 4 }}>
                      {t.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {board.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📋</div>
          <div style={s.emptyTitle}>No entries yet this week</div>
          <p style={s.emptySub}>Start journaling to earn points and appear on the leaderboard!</p>
        </div>
      )}

    </div>
  );
}

const s = {
  page:        { maxWidth: 660, margin: "0 auto", padding: "24px 16px 60px" },
  centered:    { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 },
  spinner:     { width: 32, height: 32, border: "2.5px solid #e5e7eb", borderTop: "2.5px solid #534AB7", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  retryBtn:    { fontSize: 13, color: "#fff", background: "#534AB7", border: "none", padding: "9px 22px", borderRadius: 10, cursor: "pointer", fontWeight: 600 },

  hero:        { textAlign: "center", padding: "16px 0 22px" },
  heroTitle:   { fontSize: 26, fontWeight: 600, color: "var(--color-text-primary, #868686)", letterSpacing: "-0.02em", marginBottom: 6 , marginTop: -50 },
  heroDate:    { fontSize: 13, color: "var(--color-text-secondary, #6b7280)", marginBottom: 3 },
  heroSub:     { fontSize: 12, color: "var(--color-text-tertiary, #9ca3af)" },

  timerBar:    { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-background-secondary, #f9fafb)", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "10px 16px", marginBottom: 14 },
  timerLabel:  { fontSize: 10, color: "var(--color-text-tertiary, #9ca3af)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 },
  timerVal:    { fontSize: 15, fontWeight: 600, color: "var(--color-text-primary, #111827)" },
  liveDot:     { width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 },
  liveText:    { fontSize: 12, color: "var(--color-text-secondary, #6b7280)" },
  weekChip:    { fontSize: 11, fontWeight: 500, background: "#EEEDFE", color: "#3C3489", padding: "3px 10px", borderRadius: 99 },

  infoBanner:  { display: "flex", alignItems: "flex-start", gap: 10, background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: 12, padding: "10px 14px", marginBottom: 20 },
  infoText:    { fontSize: 13, fontWeight: 600, color: "#3C3489" },
  infoSub:     { fontSize: 12, color: "#534AB7", marginTop: 2 },

  myCard:      { display: "flex", alignItems: "center", gap: 14, border: "1.5px solid", borderRadius: 14, padding: "14px 18px", marginBottom: 20, background: "var(--color-background-primary, #fff)" },
  myName:      { fontSize: 15, fontWeight: 600, color: "var(--color-text-primary, #111827)", display: "flex", alignItems: "center", gap: 8 },
  mySub:       { fontSize: 12, color: "var(--color-text-secondary, #6b7280)", marginTop: 3 },
  youChip:     { fontSize: 10, fontWeight: 600, background: "#EEEDFE", color: "#534AB7", padding: "2px 8px", borderRadius: 99, flexShrink: 0 },
  tierPill:    { display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 99, textAlign: "center" },

  streakBanner:{ display: "flex", alignItems: "flex-start", gap: 10, background: "#FAEEDA", border: "0.5px solid #EF9F27", borderRadius: 12, padding: "12px 14px", marginBottom: 20 },
  streakText:  { fontSize: 13, fontWeight: 600, color: "#633806" },
  streakSub:   { fontSize: 12, color: "#854F0B", marginTop: 2 },

  sectionLabel:{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary, #9ca3af)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 2px", marginBottom: 10 },

  podium:      { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28, alignItems: "end" },
  podCard:     { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "var(--color-background-primary, #fff)", borderRadius: 16, padding: "22px 10px 16px", position: "relative" },
  crown:       { position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: 20 },
  podAvatar:   { width: 46, height: 46, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 600 },
  podName:     { fontSize: 12, fontWeight: 500, color: "var(--color-text-primary, #111827)", textAlign: "center", lineHeight: 1.3 },

  listRow:     { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12 },
  listRank:    { fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary, #6b7280)", minWidth: 30, textAlign: "center" },
  listAvatar:  { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, flexShrink: 0 },
  listName:    { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary, #111827)" },
  progressWrap:{ height: 3, background: "#f3f4f6", borderRadius: 99 },
  progressFill:{ height: 3, borderRadius: 99, transition: "width 0.4s ease" },

  empty:       { textAlign: "center", padding: "52px 20px" },
  emptyIcon:   { fontSize: 40, marginBottom: 14 },
  emptyTitle:  { fontSize: 16, fontWeight: 600, color: "var(--color-text-primary, #111827)", marginBottom: 8 },
  emptySub:    { fontSize: 13, color: "var(--color-text-secondary, #6b7280)", lineHeight: 1.6, maxWidth: 300, margin: "0 auto" },
};