import { useState, useEffect, useRef } from "react";
import hcmData from "./hcmData.js";
import mlnData from "./mlnData.js";

const OPTION_LABELS = ["a", "b", "c", "d"];
const SESSION_KEY = "quiz_session_start";
const STATE_KEY = "quiz_state";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

function getOptionKeys(q) {
  return OPTION_LABELS.filter((k) => q.options[k]);
}

function getStatusColor(status) {
  if (status === "correct") return "#22c55e";
  if (status === "incorrect") return "#ef4444";
  if (status === "bookmarked") return "#f59e0b";
  return "#cbd5e1";
}

function checkSessionExpired() {
  try {
    const startTime = localStorage.getItem(SESSION_KEY);
    if (!startTime) return true;
    return Date.now() - parseInt(startTime) > SESSION_DURATION;
  } catch {
    return true;
  }
}

function initSession() {
  try {
    if (!localStorage.getItem(SESSION_KEY)) {
      localStorage.setItem(SESSION_KEY, Date.now().toString());
    }
  } catch {}
}

function getRemainingTime() {
  try {
    const startTime = localStorage.getItem(SESSION_KEY);
    if (!startTime) return SESSION_DURATION;
    const elapsed = Date.now() - parseInt(startTime);
    return Math.max(0, SESSION_DURATION - elapsed);
  } catch {
    return SESSION_DURATION;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {}
}

function clearSavedState() {
  try {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export default function QuizApp() {
  const [sessionExpired, setSessionExpired] = useState(() => checkSessionExpired());
  const [showExpiredMsg, setShowExpiredMsg] = useState(false);

  // Restore from localStorage or use defaults
  const saved = sessionExpired ? null : loadState();
  const [dataset, setDataset] = useState(saved?.dataset || "hcm");
  const [current, setCurrent] = useState(saved?.current || 0);
  const [selected, setSelected] = useState(saved?.selected || {});
  const [bookmarks, setBookmarks] = useState(saved?.bookmarks || {});

  const questions = dataset === "hcm" ? hcmData : mlnData;
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);
  const [jumpValue, setJumpValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [starPulse, setStarPulse] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const navGridRef = useRef(null);

  const total = questions.length;
  const q = questions[current];
  const optionKeys = getOptionKeys(q);
  const userAnswer = selected[current];
  const isAnswered = userAnswer !== undefined;
  const correctKey = q.answer ? q.answer.toLowerCase() : "";
  const isCorrect = isAnswered && userAnswer === correctKey;

  const correctCount = Object.entries(selected).filter(([idx, key]) => {
    const qi = questions[parseInt(idx)];
    return qi && key === (qi.answer ? qi.answer.toLowerCase() : "");
  }).length;
  const incorrectCount = Object.keys(selected).length - correctCount;

  // Save state to localStorage on every change
  useEffect(() => {
    if (!sessionExpired) {
      saveState({ dataset, current, selected, bookmarks });
    }
  }, [dataset, current, selected, bookmarks, sessionExpired]);

  // Session expiry logic
  useEffect(() => {
    if (sessionExpired) {
      setShowExpiredMsg(true);
      return;
    }
    initSession();

    const interval = setInterval(() => {
      if (checkSessionExpired()) {
        setSessionExpired(true);
        setShowExpiredMsg(true);
        setSelected({});
        setBookmarks({});
        setCurrent(0);
        clearSavedState();
        clearInterval(interval);
      }
    }, 60 * 1000); // check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sessionExpired) {
      setCurrent(0);
      setSelected({});
      setBookmarks({});
    }
    setShowBookmarkPanel(false);
  }, [dataset]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) setCurrent((c) => Math.min(c + 1, total - 1));
      else setCurrent((c) => Math.max(c - 1, 0));
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!navGridRef.current) return;
    const idx = current;
    const btn = navGridRef.current.querySelector("[data-idx='" + idx + "']");
    if (btn) btn.scrollIntoView({ block: "nearest" });
  }, [current]);

  const gotoNext = () => setCurrent((c) => Math.min(c + 1, total - 1));
  const gotoPrev = () => setCurrent((c) => Math.max(c - 1, 0));

  const handleSelect = (key) => {
    if (isAnswered) return;
    setSelected((s) => ({ ...s, [current]: key }));
  };

  const handleReset = () => {
    setSelected((s) => {
      const copy = { ...s };
      delete copy[current];
      return copy;
    });
  };

  const toggleBookmark = () => {
    setStarPulse(true);
    setTimeout(() => setStarPulse(false), 400);
    setBookmarks((b) => {
      const copy = { ...b };
      if (copy[current]) delete copy[current];
      else copy[current] = true;
      return copy;
    });
  };

  const handleJump = () => {
    const n = parseInt(jumpValue);
    if (!isNaN(n) && n >= 1 && n <= total) {
      setCurrent(n - 1);
      setJumpValue("");
      setSidebarOpen(false);
    }
  };

  const statusFor = (idx) => {
    if (bookmarks[idx]) return "bookmarked";
    const sel = selected[idx];
    if (!sel) return "none";
    const ans = questions[idx].answer ? questions[idx].answer.toLowerCase() : "";
    return sel === ans ? "correct" : "incorrect";
  };

  const bookmarkCount = Object.keys(bookmarks).length;
  const isBookmarked = !!bookmarks[current];

  // Format remaining time
  const [remaining, setRemaining] = useState(getRemainingTime());
  useEffect(() => {
    const t = setInterval(() => setRemaining(getRemainingTime()), 60 * 1000);
    return () => clearInterval(t);
  }, []);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);

  const handleRestart = () => {
    try {
      localStorage.setItem(SESSION_KEY, Date.now().toString());
    } catch {}
    setSessionExpired(false);
    setShowExpiredMsg(false);
    setSelected({});
    setBookmarks({});
    setCurrent(0);
    setDataset("hcm");
  };

  const sidebarMobileStyle = {
    position: "fixed", top: 0, left: 0, width: 300, height: "100dvh",
    zIndex: 50, overflowY: "auto", padding: "80px 16px 24px",
    background: "#f8fafc", boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
    display: "flex", flexDirection: "column", gap: 16,
  };
  const sidebarDesktopStyle = { display: "flex", flexDirection: "column", gap: 16 };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", color: "#1e293b" }}>

      {/* ===== HEADER ===== */}
      <header style={{ background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 60%, #ef4444 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(185,28,28,0.35)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen((o) => !o)} className="menu-btn"
              style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: "6px 8px", borderRadius: 8 }}>
              ☰
            </button>
            <span style={{ fontSize: 28 }}>🎓</span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: "clamp(0.85rem, 3vw, 1.2rem)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {dataset === "hcm" ? "Tư tưởng HCM" : "Mác – Lênin"}
              </h1>
              <p className="subtitle" style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.75)" }}>
                {dataset === "hcm" ? "HCM202 – " + hcmData.length + " câu hỏi" : "MLN131 – " + mlnData.length + " câu hỏi"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Dataset switcher */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 3, gap: 3 }}>
              {["HCM", "MLN"].map((ds) => {
                const dsKey = ds.toLowerCase();
                const active = dataset === dsKey;
                return (
                  <button key={ds} onClick={() => setDataset(dsKey)}
                    style={{ padding: "5px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", transition: "all 0.2s", background: active ? "#fff" : "transparent", color: active ? "#dc2626" : "rgba(255,255,255,0.85)", boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none" }}>
                    {ds}
                  </button>
                );
              })}
            </div>

            {/* Score */}
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 999, padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#86efac", fontWeight: 700 }}>{correctCount}</span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>✓</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
              <span style={{ color: "#fca5a5", fontWeight: 700 }}>{incorrectCount}</span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>✗</span>
            </div>

            {/* Bookmarks btn */}
            <button onClick={() => setShowBookmarkPanel((s) => !s)}
              style={{ background: showBookmarkPanel ? "#b45309" : "#f59e0b", border: "none", color: "#fff", fontWeight: 700, padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", boxShadow: "0 2px 8px rgba(245,158,11,0.4)" }}>
              ⭐ {bookmarkCount}
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 40, backdropFilter: "blur(2px)" }} />
      )}

      {/* Session expired overlay */}
      {showExpiredMsg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Phiên đã hết hạn</h2>
            <p style={{ margin: "0 0 20px", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6 }}>
              Phiên ôn tập đã hết hạn sau 24 giờ.
              <br />Tất cả tiến trình đã được đặt lại.
            </p>
            <button onClick={handleRestart}
              style={{ padding: "12px 32px", borderRadius: 14, background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(220,38,38,0.4)" }}>
              Bắt đầu lại 🚀
            </button>
          </div>
        </div>
      )}

      {/* ===== MAIN ===== */}
      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "24px 16px", flex: 1, width: "100%" }}>
        <div className="main-grid" style={{ display: "grid", gap: 24, alignItems: "start" }}>

          {/* SIDEBAR */}
          <div id="sidebar-panel" style={sidebarOpen ? sidebarMobileStyle : sidebarDesktopStyle}>

            {/* Nav card */}
            <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              <h3 style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                <span style={{ color: "#dc2626" }}>🧭</span> Điều hướng câu hỏi
              </h3>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input type="number" min={1} max={total} value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJump()}
                  placeholder={"Nhập số (1-" + total + ")..."}
                  style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "8px 12px", fontSize: "0.85rem", outline: "none", fontFamily: "inherit" }} />
                <button onClick={handleJump} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 12, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>Đi</button>
              </div>

              <div ref={navGridRef} style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, maxHeight: "200px", overflowY: "auto", paddingRight: 2 }}>
                {questions.map((_, idx) => {
                  const st = statusFor(idx);
                  const isActive = idx === current;
                  return (
                    <button key={idx} data-idx={idx}
                      onClick={() => { setCurrent(idx); setSidebarOpen(false); }}
                      style={{ width: "100%", aspectRatio: "1", borderRadius: 8, border: isActive ? "2px solid #dc2626" : "1.5px solid transparent", background: isActive ? "#fef2f2" : getStatusColor(st) + "33", color: isActive ? "#b91c1c" : "#475569", fontWeight: isActive ? 700 : 500, fontSize: "0.7rem", cursor: "pointer", transition: "all 0.1s", boxShadow: isActive ? "0 0 0 3px #fecaca" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize: "0.72rem", color: "#64748b" }}>
                {[["#22c55e", "Đúng"], ["#ef4444", "Sai"], ["#f59e0b", "Đánh dấu"], ["#cbd5e1", "Chưa làm"]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block", flexShrink: 0 }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Bookmarks panel */}
            {showBookmarkPanel && (
              <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                <h3 style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                  <span style={{ color: "#f59e0b" }}>⭐</span> Câu hỏi đã đánh dấu
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                  {Object.keys(bookmarks).length === 0
                    ? <p style={{ color: "#94a3b8", fontSize: "0.8rem", textAlign: "center", padding: 12 }}>Chưa có câu hỏi nào được đánh dấu sao.</p>
                    : Object.keys(bookmarks).map((idx) => {
                        const qi = questions[parseInt(idx)];
                        if (!qi) return null;
                        return (
                          <button key={idx}
                            onClick={() => { setCurrent(parseInt(idx)); setSidebarOpen(false); }}
                            style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "8px 12px", cursor: "pointer", textAlign: "left", fontSize: "0.78rem", color: "#92400e", display: "flex", alignItems: "center", gap: 8, transition: "all 0.1s", fontFamily: "inherit" }}>
                            <span style={{ background: "#f59e0b", color: "#fff", borderRadius: 6, padding: "2px 6px", fontWeight: 700, fontSize: "0.7rem", flexShrink: 0 }}>#{parseInt(idx) + 1}</span>
                            <span style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{qi.question}</span>
                          </button>
                        );
                      })
                  }
                </div>
              </div>
            )}
          </div>

          {/* QUESTION CARD */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
              style={{ background: "#fff", padding: "clamp(20px,5vw,36px)", borderRadius: 28, boxShadow: "0 2px 20px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", minHeight: 420 }}>

              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "#fef2f2", color: "#b91c1c", fontWeight: 700, padding: "5px 12px", borderRadius: 10, fontSize: "0.82rem" }}>
                    Câu {current + 1}/{total}
                  </span>
                  <span style={{ background: dataset === "hcm" ? "#fef2f2" : "#eff6ff", color: dataset === "hcm" ? "#dc2626" : "#1d4ed8", padding: "4px 10px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600 }}>
                    {dataset === "hcm" ? "HCM202" : "MLN131"}
                  </span>
                </div>
                <button onClick={toggleBookmark}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 26, padding: "4px 8px", borderRadius: "50%", transition: "all 0.15s", transform: starPulse ? "scale(1.25)" : "scale(1)", color: isBookmarked ? "#f59e0b" : "#cbd5e1" }}>
                  {isBookmarked ? "★" : "☆"}
                </button>
              </div>

              {/* Progress */}
              <div style={{ height: 4, background: "#f1f5f9", borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #dc2626, #f87171)", width: ((current + 1) / total) * 100 + "%", transition: "width 0.3s ease" }} />
              </div>

              {/* Question */}
              <h2 style={{ margin: "0 0 24px", fontSize: "clamp(0.95rem,2.5vw,1.15rem)", fontWeight: 600, color: "#0f172a", lineHeight: 1.65, flexShrink: 0 }}>
                {q.question}
              </h2>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {optionKeys.map((key) => {
                  const isCorrectOpt = key === correctKey;
                  const isWrong = isAnswered && key === userAnswer && !isCorrect;
                  let bg = "#fff", borderColor = "#e2e8f0", textColor = "#334155";
                  if (isAnswered) {
                    if (isCorrectOpt) { bg = "#dcfce7"; borderColor = "#22c55e"; textColor = "#166534"; }
                    else if (isWrong) { bg = "#fef2f2"; borderColor = "#ef4444"; textColor = "#991b1b"; }
                    else { bg = "#fff"; borderColor = "#e2e8f0"; textColor = "#94a3b8"; }
                  }
                  return (
                    <button key={key} onClick={() => handleSelect(key)} disabled={isAnswered}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px", borderRadius: 14, cursor: isAnswered ? "default" : "pointer", border: "2px solid " + borderColor, transition: "all 0.15s ease", fontSize: "0.93rem", lineHeight: 1.55, fontWeight: 500, textAlign: "left", width: "100%", background: bg, color: textColor, minHeight: 44, fontFamily: "inherit" }}>
                      <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: isAnswered ? (isCorrectOpt ? "#22c55e" : isWrong ? "#ef4444" : "#e2e8f0") : "#f1f5f9", color: isAnswered ? ((isCorrectOpt || isWrong) ? "#fff" : "#94a3b8") : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", transition: "all 0.15s", marginTop: 1 }}>
                        {isAnswered ? (isCorrectOpt ? "✓" : isWrong ? "✗" : key.toUpperCase()) : key.toUpperCase()}
                      </span>
                      {q.options[key]}
                    </button>
                  );
                })}
              </div>

              {/* Result */}
              {isAnswered && (
                <div style={{ marginTop: 20, padding: "14px 18px", background: isCorrect ? "#f0fdf4" : "#fef2f2", border: "1.5px solid " + (isCorrect ? "#86efac" : "#fca5a5"), borderRadius: 14, color: isCorrect ? "#166534" : "#991b1b", fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  {isCorrect ? "🎉 Chính xác!" : "❌ Sai rồi! Đáp án đúng là: " + correctKey.toUpperCase()}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={gotoPrev} disabled={current === 0}
                    style={{ padding: "10px 18px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: current === 0 ? "#f8fafc" : "#fff", color: current === 0 ? "#cbd5e1" : "#475569", cursor: current === 0 ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.88rem", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                    ◀ Trước
                  </button>
                  {isAnswered && (
                    <button onClick={handleReset}
                      style={{ padding: "10px 16px", borderRadius: 12, background: "#fef3c7", border: "1.5px solid #fde68a", color: "#92400e", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", transition: "all 0.15s", fontFamily: "inherit" }}>
                      ↺ Chọn lại
                    </button>
                  )}
                </div>
                <button onClick={gotoNext} disabled={current === total - 1}
                  style={{ padding: "10px 22px", borderRadius: 12, background: current === total - 1 ? "#f1f5f9" : "linear-gradient(135deg, #dc2626, #ef4444)", color: current === total - 1 ? "#94a3b8" : "#fff", border: "none", cursor: current === total - 1 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem", transition: "all 0.15s", boxShadow: current === total - 1 ? "none" : "0 4px 12px rgba(220,38,38,0.35)", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                  Tiếp ▶
                </button>
              </div>
            </div>

            {/* Info bar */}
            <div style={{ background: "#fff", padding: "10px 16px", borderRadius: 14, border: "1px solid #f1f5f9", fontSize: "0.75rem", color: "#94a3b8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>💡 Kéo trái/phải để chuyển câu • Nhấn ★ để đánh dấu{!sessionExpired ? ` • Còn ${hours}h ${minutes}m` : ''}</span>
              <span style={{ fontWeight: 600, color: "#64748b" }}>{dataset === "hcm" ? "Tư tưởng HCM" : "Mác–Lênin"}</span>
            </div>
          </div>
        </div>
      </main>

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "fixed", bottom: 24, right: 20, width: 48, height: 48, borderRadius: "50%", background: "#dc2626", color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(220,38,38,0.4)", zIndex: 30, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
          ↑
        </button>
      )}

      <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "20px 16px", marginTop: 32, borderTop: "1px solid #1e293b", textAlign: "center", fontSize: "0.75rem" }}>
        <p>© 2026 Ứng dụng Ôn tập Trắc nghiệm • HCM202 ({hcmData.length} câu) &amp; MLN131 ({mlnData.length} câu)</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; -webkit-tap-highlight-color: transparent; }
        .subtitle { display: block; }
        .main-grid { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 900px) {
          .main-grid { grid-template-columns: 280px 1fr !important; }
          #sidebar-panel { position: static !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; }
          .menu-btn { display: none !important; }
        }
        @media (max-width: 640px) {
          .subtitle { display: none !important; }
        }
        button:hover:not(:disabled) { opacity: 0.88; }
        input:focus { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.12); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}
