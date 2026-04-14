import React, { useState ,useEffect} from "react";
import { api } from "../services/api.js"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const PROMPTS = [
  "How are you feeling today?",
  "What made you smile this week?",
  "What's been on your mind lately?",
  "What are you grateful for right now?",
  "What drained your energy today?",
  "Want to fix your mistakes?",
  "What’s one thing you learned today?",
  "What’s been distracting you?",
  "What are you holding onto?",
];


function RotatingText() {
  const [index, setIndex] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % PROMPTS.length);
      setKey(k => k + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 600,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgb(127, 129, 254)", marginBottom: 16,
      }}>
        Today's prompt
      </div>
      <h2 key={key} className="rotating-text" style={{
        fontSize: 32, fontWeight: 700, color: "#fff",
        letterSpacing: "-0.025em", lineHeight: 1.25,
        marginBottom: 20,
      }}>
        "{PROMPTS[index]}"
      </h2>
    </div>
  );
}

export default function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        const res = await api.post("/auth/login", { email, password });
        data = res.data;
      } else {
        const res = await api.post("/auth/register", { name, email, password });
        data = res.data;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || "Something went wrong.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#fff",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .a-input {
          width: 100%;
          padding: 12px 15px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #fafafa;
          border: 1.5px solid #ebebeb;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .a-input:focus {
          background: #fff;
          border-color: #4e59fe;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.08);
        }
        .a-input::placeholder { color: #c0c0c0; }

        .a-btn {
          width: 100%;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          color: #fff;
          background: #1a1a2e;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          letter-spacing: 0.01em;
        }
        .a-btn:hover:not(:disabled) { background: #16213e; transform: translateY(-1px); }
        .a-btn:active:not(:disabled) { transform: scale(0.99); }
        .a-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .a-switch {
          background: none; border: none;
          font-family: inherit; font-size: 13px;
          font-weight: 600; color: #4f46e5;
          cursor: pointer; padding: 0;
        }
        .a-switch:hover { text-decoration: underline; }

        .a-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 7px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .rotating-text {
          display: inline-block;
          animation: fadeSlide 0.5s ease;
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 860px) {
          .auth-left { display: none !important; }
          .auth-right { width: 100% !important; padding: 32px 20px !important; }
        }
      `}</style>

      {/* ── Left panel ── */}
      <div className="auth-left" style={{
        width: "46%",
        background: "#080629",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "44px 52px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }} />

        {/* Glow */}
        <div style={{
          position: "absolute",
          width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167, 168, 178, 0.17) 0%, transparent 70%)",
          top: -80, left: -80,
          pointerEvents: "none",
        }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(76, 78, 181, 0.2)",
            border: "1px solid rgba(166, 167, 244, 0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M3 4.5C3 3.67 3.67 3 4.5 3h9C14.33 3 15 3.67 15 4.5v9c0 .83-.67 1.5-1.5 1.5h-9C3.67 15 3 14.33 3 13.5v-9z" stroke="rgba(100, 103, 236, 0.9)" strokeWidth="1.3"/>
              <path d="M6 7h6M6 9.5h4M6 12h5" stroke="rgba(99,102,241,0.9)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>InnerSpace</span>
        </div>

        {/* Main content */}
        <div style={{ position: "relative" }}>

          {/* Rotating writing prompt */}
          <RotatingText />

          <p style={{
            fontSize: 15, color: "rgba(249, 249, 249, 0.57)",
            lineHeight: 1.75, marginBottom: 48, maxWidth: 340, fontWeight: 400,
          }}>
            A private space to write, reflect, and understand your emotional patterns over time.
          </p>

          {/* Minimal stat row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}>
            {[
              { num: "10+",    label: "Mood levels tracked" },
              { num: "365",  label: "Days of insights" },
              { num: "∞",    label: "Private entries" },
              { num: "5 min", label: "Avg daily time" },
            ].map(s => (
              <div key={s.label} style={{
                padding: "16px 18px",
                background: "rgba(255, 255, 255, 0)",
                border: "1px solid rgba(255, 251, 251, 0.23)",
                borderRadius: 14,
              }}>
                <div style={{
                  fontSize: 22, fontWeight: 700, color: "#fff",
                  letterSpacing: "-0.02em", marginBottom: 4,
                }}>{s.num}</div>
                <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)", fontWeight: 400 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ position: "relative" }}>
          <div style={{
            width: 28, height: 2,
            background: "rgba(99, 101, 241, 0.89)",
            borderRadius: 99, marginBottom: 14,
          }} />
          <p style={{
            fontSize: 13, color: "rgba(255, 255, 255, 0.41)",
            lineHeight: 1.75, fontStyle: "italic", margin: "0 0 8px",
            maxWidth: 340,
          }}>
            "Writing about your feelings reduces their intensity and helps your brain make sense of difficult experiences."
          </p>
          <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.28)", fontWeight: 500 }}>
            — James Pennebaker, Psychologist
          </span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right" style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        background: "#dce2fa",
      }}>
        <div style={{
  width: "100%", maxWidth: 400,
  background: "#fff",
  borderRadius: 20,
  padding: "36px 32px",
  boxShadow: "0 0 0 1px rgba(99,102,241,0.12), 0 8px 32px rgba(99,102,241,0.12), 0 0 80px rgba(99,102,241,0.08)",
  border: "1px solid rgba(99,102,241,0.15)",
  position: "relative",
}}>
  {/* Glow effect */}
  <div style={{
    position: "absolute", inset: -1,
    borderRadius: 21,
    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08), transparent)",
    pointerEvents: "none", zIndex: -1,
  }} />

          {/* Mobile brand */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 36,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "#4f46e5",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M3 4.5C3 3.67 3.67 3 4.5 3h9C14.33 3 15 3.67 15 4.5v9c0 .83-.67 1.5-1.5 1.5h-9C3.67 15 3 14.33 3 13.5v-9z" stroke="#fff" strokeWidth="1.3"/>
                <path d="M6 7h6M6 9.5h4M6 12h5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>InnerSpace</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 700, color: "#0f172a",
              letterSpacing: "-0.025em", marginBottom: 8, lineHeight: 1.2,
            }}>
              {isLogin ? "Welcome back" : "Start journaling today"}
            </h2>
            <p style={{ fontSize: 14, color: "#818995", lineHeight: 1.6 }}>
              {isLogin
                ? "Good to have you back. Your entries are waiting."
                : "Free forever. Just you and your thoughts."}
            </p>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {!isLogin && (
              <div>
                <label className="a-label">Name</label>
                <input
                  className="a-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="a-label">Email</label>
              <input
                className="a-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoFocus={isLogin}
              />
            </div>

            <div>
  <label className="a-label">Password</label>
  <div style={{ position: "relative" }}>
    <input
      className="a-input"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={e => setPassword(e.target.value)}
      placeholder="••••••••"
      onKeyDown={e => e.key === "Enter" && handleSubmit()}
      style={{ paddingRight: 44 }}
    />
    <button
      type="button"
      onClick={() => setShowPassword(p => !p)}
      style={{
        position: "absolute", right: 12, top: "50%",
        transform: "translateY(-50%)",
        background: "none", border: "none",
        cursor: "pointer", padding: 4,
        color: "#9ca3af", fontSize: 16,
        display: "flex", alignItems: "center",
      }}
    >
      {showPassword ? (
    <FontAwesomeIcon icon={faEye} style={{ color: "#000000" }} />
  ) : (
    <FontAwesomeIcon icon={faEyeSlash} style={{ color: "#000000" }} />
  )}
    </button>
  </div>
</div>

          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: "#fef2f2", border: "1px solid #fee2e2",
              borderRadius: 10, fontSize: 13, color: "#b91c1c", lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <button
            className="a-btn"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 22 }}
          >
            {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>

          {/* Register perks */}
          {!isLogin && (
            <div style={{
              marginTop: 18,
              padding: "14px 16px",
              background: "#f9f9ff",
              borderRadius: 12,
              border: "1px solid #eeeeff",
            }}>
              {[
                "Mood detection from your writing",
                "Emotional trends & weekly insights",
                "Streak tracking & leaderboard",
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  gap: 10, padding: "4px 0",
                }}>
                  <div style={{
                    width: 15, height: 15, borderRadius: "50%",
                    background: "#ede9fe", color: "#4f46e5",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 8,
                    fontWeight: 700, flexShrink: 0,
                  }}>✓</div>
                  <span style={{ fontSize: 12.5, color: "#6b7280" }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Switch */}
          <p style={{
            marginTop: 24, textAlign: "center",
            fontSize: 13, color: "#9ca3af",
          }}>
            {isLogin ? "No account yet? " : "Already signed up? "}
            <button
              className="a-switch"
              onClick={() => { setIsLogin(!isLogin); setError(""); setName(""); setShowPassword(false); }}
            >
              {isLogin ? "Sign up free" : "Sign in"}
            </button>
          </p>

        </div>
      </div>
    </div>
  )};
