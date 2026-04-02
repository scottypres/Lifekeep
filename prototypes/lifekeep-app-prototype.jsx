import { useState, useEffect } from "react";

const COLORS = {
  bg: "#F7F5F0",
  card: "#FFFFFF",
  accent: "#2D5A3D",
  accentLight: "#E8F0EA",
  accentMid: "#4A8B62",
  warm: "#C4A265",
  warmLight: "#FBF6ED",
  text: "#1A1A1A",
  textMid: "#5A5A5A",
  textLight: "#9A9A9A",
  border: "#E8E4DC",
  overdue: "#C44B3F",
  overdueBg: "#FDF0EE",
  soon: "#D4932A",
  soonBg: "#FDF6E8",
  good: "#2D5A3D",
  goodBg: "#E8F0EA",
};

const CATEGORIES = {
  home: { icon: "🏠", label: "Home", color: "#5B8C6E" },
  vehicle: { icon: "🚗", label: "Vehicle", color: "#6B7FBF" },
  personal: { icon: "👤", label: "Personal", color: "#B07BAC" },
  health: { icon: "💊", label: "Health", color: "#CF7B5F" },
  financial: { icon: "📄", label: "Financial", color: "#C4A265" },
};

const SAMPLE_ITEMS = [
  { id: 1, name: "HVAC Filter", category: "home", interval: "90 days", lastDone: "2026-01-05", nextDue: "2026-04-05", note: "20x25x1 MERV 11", status: "soon" },
  { id: 2, name: "Oil Change", category: "vehicle", interval: "6,000 mi", lastDone: "2025-12-18", nextDue: "2026-03-18", note: "Full synthetic 5W-30 · Jiffy Lube · 44,200 mi", status: "overdue" },
  { id: 3, name: "Dental Cleaning", category: "health", interval: "6 months", lastDone: "2025-10-15", nextDue: "2026-04-15", note: "Dr. Patel · (555) 234-8901", status: "soon" },
  { id: 4, name: "Gutter Cleaning", category: "home", interval: "6 months", lastDone: "2025-11-01", nextDue: "2026-05-01", note: "", status: "good" },
  { id: 5, name: "Water Heater Flush", category: "home", interval: "12 months", lastDone: "2025-08-20", nextDue: "2026-08-20", note: "40 gal · garage", status: "good" },
  { id: 6, name: "Car Registration", category: "vehicle", interval: "12 months", lastDone: "2025-06-01", nextDue: "2026-06-01", note: "FL plate #ABC-1234", status: "good" },
  { id: 7, name: "Eye Exam", category: "health", interval: "12 months", lastDone: "2025-05-10", nextDue: "2026-05-10", note: "Dr. Kim · Vision Center", status: "good" },
  { id: 8, name: "Passport Renewal", category: "financial", interval: "10 years", lastDone: "2018-03-15", nextDue: "2028-03-15", note: "Exp: Mar 2028", status: "good" },
  { id: 9, name: "Smoke Detector Batteries", category: "home", interval: "6 months", lastDone: "2025-12-01", nextDue: "2026-06-01", note: "9V · 4 detectors", status: "good" },
  { id: 10, name: "Dryer Vent Cleaning", category: "home", interval: "12 months", lastDone: "2025-07-14", nextDue: "2026-07-14", note: "", status: "good" },
  { id: 11, name: "Tire Rotation", category: "vehicle", interval: "7,500 mi", lastDone: "2026-01-10", nextDue: "2026-06-10", note: "Discount Tire · 45,800 mi", status: "good" },
  { id: 12, name: "Toothbrush Replacement", category: "personal", interval: "3 months", lastDone: "2026-01-20", nextDue: "2026-04-20", note: "Oral-B heads", status: "soon" },
];

const getStatusInfo = (status) => {
  switch (status) {
    case "overdue": return { label: "Overdue", bg: COLORS.overdueBg, color: COLORS.overdue, dot: COLORS.overdue };
    case "soon": return { label: "Due Soon", bg: COLORS.soonBg, color: COLORS.soon, dot: COLORS.soon };
    default: return { label: "On Track", bg: COLORS.goodBg, color: COLORS.good, dot: COLORS.good };
  }
};

const formatDate = (d) => {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const daysUntil = (d) => {
  const now = new Date("2026-04-02");
  const target = new Date(d + "T00:00:00");
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff}d`;
};

// ─── Phone Frame ───
const PhoneFrame = ({ children }) => (
  <div style={{
    width: 375, maxWidth: "100%", height: 780, background: COLORS.bg,
    borderRadius: 40, boxShadow: "0 25px 80px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.08)",
    overflow: "hidden", position: "relative", border: `8px solid #1A1A1A`,
    display: "flex", flexDirection: "column",
    fontFamily: "'DM Sans', 'Avenir', -apple-system, sans-serif",
  }}>
    <div style={{
      height: 30, background: "#1A1A1A", display: "flex", justifyContent: "center",
      alignItems: "flex-end", paddingBottom: 4, flexShrink: 0,
    }}>
      <div style={{ width: 120, height: 5, borderRadius: 10, background: "#333" }} />
    </div>
    {children}
  </div>
);

// ─── Header ───
const Header = ({ title, subtitle, onBack, rightAction }) => (
  <div style={{
    padding: "14px 20px 12px", background: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0,
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "none", border: "none", fontSize: 20, cursor: "pointer",
            padding: "2px 4px", color: COLORS.accent,
          }}>←</button>
        )}
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {rightAction}
    </div>
  </div>
);

// ─── Tab Bar ───
const TabBar = ({ active, onNavigate }) => {
  const tabs = [
    { id: "home", icon: "⊞", label: "Dashboard" },
    { id: "items", icon: "☰", label: "All Items" },
    { id: "add", icon: "+", label: "Add" },
    { id: "digest", icon: "✉", label: "Digest" },
    { id: "profile", icon: "◉", label: "Settings" },
  ];
  return (
    <div style={{
      display: "flex", borderTop: `1px solid ${COLORS.border}`,
      background: "#FDFCF9", padding: "6px 0 16px", flexShrink: 0,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onNavigate(t.id)} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0",
        }}>
          <span style={{
            fontSize: t.id === "add" ? 26 : 18,
            color: t.id === "add" ? COLORS.card : active === t.id ? COLORS.accent : COLORS.textLight,
            background: t.id === "add" ? COLORS.accent : "none",
            borderRadius: t.id === "add" ? 14 : 0,
            width: t.id === "add" ? 44 : "auto",
            height: t.id === "add" ? 32 : "auto",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: t.id === "add" ? 300 : 400,
            lineHeight: 1,
          }}>{t.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? COLORS.accent : COLORS.textLight,
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

// ─── Status Pill ───
const StatusPill = ({ status, dueDate }) => {
  const info = getStatusInfo(status);
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: info.color,
      background: info.bg, borderRadius: 20, padding: "3px 10px",
      whiteSpace: "nowrap",
    }}>
      {status === "overdue" ? daysUntil(dueDate) : status === "soon" ? daysUntil(dueDate) : "✓ On Track"}
    </span>
  );
};

// ─── Dashboard Screen ───
const DashboardScreen = ({ items, onSelectItem, onNavigate }) => {
  const overdue = items.filter(i => i.status === "overdue");
  const soon = items.filter(i => i.status === "soon");
  const goodCount = items.filter(i => i.status === "good").length;
  const score = Math.round((goodCount / items.length) * 100);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
      {/* Score Card */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.accent} 0%, #3A7550 100%)`,
          borderRadius: 18, padding: "22px 22px 18px", color: "#fff", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -30, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 500, letterSpacing: 0.5 }}>MAINTENANCE SCORE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }}>{score}</span>
            <span style={{ fontSize: 20, opacity: 0.6, fontWeight: 500 }}>/ 100</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
            {goodCount} of {items.length} items on track
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      {(overdue.length > 0 || soon.length > 0) && (
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textLight, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
            Needs Attention
          </div>
          {[...overdue, ...soon].map(item => (
            <button key={item.id} onClick={() => onSelectItem(item)} style={{
              width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderLeft: `4px solid ${getStatusInfo(item.status).dot}`,
              textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{CATEGORIES[item.category].icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 2 }}>
                    Every {item.interval} · Due {formatDate(item.nextDue)}
                  </div>
                </div>
              </div>
              <StatusPill status={item.status} dueDate={item.nextDue} />
            </button>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textLight, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
          By Category
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = items.filter(i => i.category === key).length;
            if (count === 0) return null;
            const catOverdue = items.filter(i => i.category === key && i.status !== "good").length;
            return (
              <button key={key} onClick={() => onNavigate("items", key)} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14,
                padding: "14px 16px", cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{cat.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: cat.color }}>{count}</div>
                <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>
                  {catOverdue > 0 ? `${catOverdue} need attention` : "All on track"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly Digest Preview */}
      <div style={{ padding: "20px 20px 8px" }}>
        <button onClick={() => onNavigate("digest")} style={{
          width: "100%", background: COLORS.warmLight, border: `1px solid ${COLORS.warm}33`,
          borderRadius: 14, padding: "16px", cursor: "pointer", textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📬</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Weekly Digest Ready</div>
              <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 2 }}>
                {overdue.length + soon.length} items need attention this week →
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

// ─── All Items Screen ───
const AllItemsScreen = ({ items, filterCategory, onSelectItem }) => {
  const [filter, setFilter] = useState(filterCategory || "all");

  useEffect(() => {
    if (filterCategory) setFilter(filterCategory);
  }, [filterCategory]);

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);
  const sorted = [...filtered].sort((a, b) => {
    const order = { overdue: 0, soon: 1, good: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {/* Filter Chips */}
      <div style={{
        display: "flex", gap: 6, padding: "12px 20px", overflowX: "auto",
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <button onClick={() => setFilter("all")} style={{
          padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          background: filter === "all" ? COLORS.accent : COLORS.card,
          color: filter === "all" ? "#fff" : COLORS.textMid,
        }}>All ({items.length})</button>
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const count = items.filter(i => i.category === key).length;
          if (count === 0) return null;
          return (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              background: filter === key ? cat.color : COLORS.card,
              color: filter === key ? "#fff" : COLORS.textMid,
            }}>{cat.icon} {cat.label}</button>
          );
        })}
      </div>

      <div style={{ padding: "8px 20px 20px" }}>
        {sorted.map(item => (
          <button key={item.id} onClick={() => onSelectItem(item)} style={{
            width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            textAlign: "left",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: getStatusInfo(item.status).dot,
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{item.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 2 }}>
                  Every {item.interval} · Due {formatDate(item.nextDue)}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 14, color: COLORS.textLight, flexShrink: 0, marginLeft: 8 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Item Detail Screen ───
const ItemDetailScreen = ({ item, onMarkDone }) => {
  const cat = CATEGORIES[item.category];
  const statusInfo = getStatusInfo(item.status);
  const [done, setDone] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
      {/* Top Card */}
      <div style={{
        background: COLORS.card, borderRadius: 18, padding: "24px 20px",
        border: `1px solid ${COLORS.border}`, marginBottom: 16, textAlign: "center",
      }}>
        <span style={{ fontSize: 42 }}>{cat.icon}</span>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginTop: 8 }}>{item.name}</div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: statusInfo.bg, color: statusInfo.color,
          padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginTop: 10,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusInfo.dot }} />
          {item.status === "overdue" ? `${daysUntil(item.nextDue)}` : item.status === "soon" ? `Due in ${daysUntil(item.nextDue)}` : "On Track"}
        </div>
      </div>

      {/* Info Rows */}
      <div style={{
        background: COLORS.card, borderRadius: 18, border: `1px solid ${COLORS.border}`,
        marginBottom: 16, overflow: "hidden",
      }}>
        {[
          { label: "Category", value: `${cat.icon} ${cat.label}` },
          { label: "Frequency", value: `Every ${item.interval}` },
          { label: "Last Done", value: formatDate(item.lastDone) },
          { label: "Next Due", value: formatDate(item.nextDue) },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 20px",
            borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.border}` : "none",
          }}>
            <span style={{ fontSize: 14, color: COLORS.textMid }}>{row.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {item.note && (
        <div style={{
          background: COLORS.warmLight, borderRadius: 18, padding: "16px 20px",
          border: `1px solid ${COLORS.warm}22`, marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.warm, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>
            Notes & Details
          </div>
          <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.5 }}>{item.note}</div>
        </div>
      )}

      {/* Mark Done Button */}
      <button
        onClick={() => { setDone(true); setTimeout(() => onMarkDone?.(item), 1200); }}
        style={{
          width: "100%", padding: "16px",
          background: done ? COLORS.good : COLORS.accent,
          color: "#fff", border: "none", borderRadius: 16,
          fontSize: 16, fontWeight: 700, cursor: "pointer",
          letterSpacing: 0.3,
          transition: "all 0.3s",
          transform: done ? "scale(0.97)" : "scale(1)",
        }}
      >
        {done ? "✓  Done! Timer Reset" : "Mark as Done"}
      </button>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <span style={{ fontSize: 12, color: COLORS.textLight }}>This resets the timer and logs today's date</span>
      </div>
    </div>
  );
};

// ─── Add Item Screen ───
const AddItemScreen = () => {
  const [mode, setMode] = useState(null);

  const templates = [
    { icon: "🏠", label: "Home & Property", examples: "HVAC, gutters, pest control, deck seal..." },
    { icon: "🚗", label: "Vehicle", examples: "Oil, tires, registration, wipers, brakes..." },
    { icon: "💊", label: "Health & Wellness", examples: "Dental, eye, physical, prescriptions..." },
    { icon: "👤", label: "Personal", examples: "Haircut, toothbrush, contacts, subscriptions..." },
    { icon: "📄", label: "Financial & Legal", examples: "Passport, license, insurance, tax docs..." },
  ];

  if (mode === "smart") {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.accent}, #3A7550)`,
          borderRadius: 18, padding: "24px 20px", color: "#fff", marginBottom: 20,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Smart Capture</div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
            Just say or type what happened. The app figures out the rest.
          </div>
        </div>

        <div style={{
          background: COLORS.card, borderRadius: 18, border: `1px solid ${COLORS.border}`,
          padding: "16px 18px", marginBottom: 16,
        }}>
          <div style={{
            background: COLORS.bg, borderRadius: 12, padding: "14px 16px",
            fontSize: 15, color: COLORS.textMid, lineHeight: 1.6,
            fontStyle: "italic",
          }}>
            "Got the oil changed at Jiffy Lube today, 47,200 miles, $65"
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: COLORS.textLight, marginBottom: 8 }}>
            AI PARSES INTO:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Item", "Oil Change"],
              ["Category", "🚗 Vehicle"],
              ["Mileage", "47,200 mi"],
              ["Cost", "$65"],
              ["Location", "Jiffy Lube"],
              ["Next Due", "~53,200 mi"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: COLORS.textMid }}>{k}</span>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: COLORS.accentLight, borderRadius: 14, padding: "14px 18px",
          fontSize: 13, color: COLORS.accent, lineHeight: 1.6,
        }}>
          💡 Works with voice, text, or photo of a receipt. No forms to fill out.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
      {/* Smart Capture CTA */}
      <button onClick={() => setMode("smart")} style={{
        width: "100%", background: `linear-gradient(135deg, ${COLORS.accent}, #3A7550)`,
        border: "none", borderRadius: 18, padding: "20px", cursor: "pointer",
        color: "#fff", textAlign: "left", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32 }}>🎙️</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Smart Capture</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Say it, type it, or snap a receipt</div>
          </div>
        </div>
      </button>

      <div style={{
        fontSize: 12, fontWeight: 600, color: COLORS.textLight, letterSpacing: 1,
        marginBottom: 12, textTransform: "uppercase",
      }}>
        Or browse templates
      </div>

      {templates.map((t, i) => (
        <div key={i} style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 14, padding: "16px", marginBottom: 8,
          cursor: "pointer",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{t.label}</div>
              <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 2 }}>{t.examples}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Digest Screen ───
const DigestScreen = ({ items }) => {
  const overdue = items.filter(i => i.status === "overdue");
  const soon = items.filter(i => i.status === "soon");
  const good = items.filter(i => i.status === "good");

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
      <div style={{
        background: COLORS.card, borderRadius: 18, border: `1px solid ${COLORS.border}`,
        padding: "22px 20px", marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, color: COLORS.textLight, fontWeight: 500 }}>Week of Apr 2 – Apr 8</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>Your Weekly Digest</div>
        <div style={{ fontSize: 14, color: COLORS.textMid, lineHeight: 1.6, marginTop: 10 }}>
          You have <strong style={{ color: COLORS.overdue }}>{overdue.length} overdue</strong> item{overdue.length !== 1 ? "s" : ""} and <strong style={{ color: COLORS.soon }}>{soon.length}</strong> coming up soon. The other {good.length} items are on track.
        </div>
      </div>

      {overdue.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: COLORS.overdue,
            letterSpacing: 0.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.overdue }} />
            OVERDUE
          </div>
          {overdue.map(item => (
            <div key={item.id} style={{
              background: COLORS.overdueBg, borderRadius: 12, padding: "14px 16px",
              marginBottom: 6, borderLeft: `3px solid ${COLORS.overdue}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{item.name}</div>
              <div style={{ fontSize: 12, color: COLORS.overdue, marginTop: 2 }}>
                Was due {formatDate(item.nextDue)} · {daysUntil(item.nextDue)}
              </div>
            </div>
          ))}
        </div>
      )}

      {soon.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: COLORS.soon,
            letterSpacing: 0.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.soon }} />
            COMING UP
          </div>
          {soon.map(item => (
            <div key={item.id} style={{
              background: COLORS.soonBg, borderRadius: 12, padding: "14px 16px",
              marginBottom: 6, borderLeft: `3px solid ${COLORS.soon}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{item.name}</div>
              <div style={{ fontSize: 12, color: COLORS.soon, marginTop: 2 }}>
                Due {formatDate(item.nextDue)} · {daysUntil(item.nextDue)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: COLORS.goodBg, borderRadius: 14, padding: "16px 18px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.good }}>{good.length} items on track</div>
          <div style={{ fontSize: 12, color: COLORS.textMid, marginTop: 2 }}>Nothing else needs attention right now</div>
        </div>
      </div>

      <div style={{
        marginTop: 16, padding: "14px 18px",
        background: COLORS.card, borderRadius: 14, border: `1px solid ${COLORS.border}`,
        fontSize: 13, color: COLORS.textMid, lineHeight: 1.6,
      }}>
        📅 This digest is sent <strong>every Monday at 8 AM</strong>. You can change the frequency in Settings.
      </div>
    </div>
  );
};

// ─── Onboarding Screen ───
const OnboardingScreen = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({ own: null, car: null, pets: null });

  const steps = [
    {
      title: "Let's set up\nyour life.",
      subtitle: "A few quick questions so we can suggest what to track.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { val: "own", icon: "🏡", label: "I own my home" },
            { val: "rent", icon: "🏢", label: "I rent" },
          ].map(opt => (
            <button key={opt.val} onClick={() => setSelections(s => ({ ...s, own: opt.val }))} style={{
              background: selections.own === opt.val ? COLORS.accentLight : COLORS.card,
              border: `2px solid ${selections.own === opt.val ? COLORS.accent : COLORS.border}`,
              borderRadius: 16, padding: "18px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 28 }}>{opt.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>{opt.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Do you have\na vehicle?",
      subtitle: "We'll add oil changes, tire rotations, registration reminders.",
      content: (
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { val: true, icon: "🚗", label: "Yes" },
            { val: false, icon: "🚶", label: "No" },
          ].map(opt => (
            <button key={String(opt.val)} onClick={() => setSelections(s => ({ ...s, car: opt.val }))} style={{
              flex: 1, background: selections.car === opt.val ? COLORS.accentLight : COLORS.card,
              border: `2px solid ${selections.car === opt.val ? COLORS.accent : COLORS.border}`,
              borderRadius: 16, padding: "24px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 36 }}>{opt.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{opt.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "You're all set.",
      subtitle: null,
      content: (
        <div>
          <div style={{
            background: COLORS.card, borderRadius: 18, border: `1px solid ${COLORS.border}`,
            padding: "20px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>
              We've added {selections.own === "own" ? "12" : "7"} items to get you started:
            </div>
            {[
              selections.own === "own" && "🏠 HVAC filter, gutters, water heater, smoke detectors, dryer vent...",
              "💊 Dental, eye exam, annual physical",
              selections.car && "🚗 Oil change, tires, registration, wipers",
              "👤 Toothbrush, haircut",
              "📄 Passport, license renewal",
            ].filter(Boolean).map((line, i) => (
              <div key={i} style={{ fontSize: 13, color: COLORS.textMid, lineHeight: 1.8 }}>{line}</div>
            ))}
          </div>
          <div style={{
            background: COLORS.accentLight, borderRadius: 14, padding: "14px 18px",
            fontSize: 13, color: COLORS.accent, lineHeight: 1.6,
          }}>
            ✨ You can add, remove, or customize anything later. This is just your starting point.
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const canProceed = step === 0 ? selections.own : step === 1 ? selections.car !== null : true;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", padding: "30px 24px 24px",
      background: COLORS.bg,
    }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= step ? COLORS.accent : COLORS.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      <div style={{
        fontSize: 30, fontWeight: 700, color: COLORS.text,
        lineHeight: 1.15, letterSpacing: -0.5, whiteSpace: "pre-line",
      }}>
        {current.title}
      </div>
      {current.subtitle && (
        <div style={{ fontSize: 15, color: COLORS.textMid, lineHeight: 1.5, marginTop: 10 }}>
          {current.subtitle}
        </div>
      )}

      <div style={{ marginTop: 28, flex: 1 }}>{current.content}</div>

      <button
        onClick={() => step < steps.length - 1 ? setStep(step + 1) : onFinish()}
        disabled={!canProceed}
        style={{
          width: "100%", padding: "16px",
          background: canProceed ? COLORS.accent : COLORS.border,
          color: canProceed ? "#fff" : COLORS.textLight,
          border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700,
          cursor: canProceed ? "pointer" : "default",
          transition: "all 0.2s", marginTop: 16,
        }}
      >
        {step === steps.length - 1 ? "Let's Go →" : "Continue"}
      </button>
    </div>
  );
};

// ─── Main App ───
export default function LifeAdminApp() {
  const [screen, setScreen] = useState("onboarding");
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const navigate = (s, category) => {
    setScreen(s);
    setSelectedItem(null);
    if (category) setFilterCategory(category);
    else setFilterCategory(null);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setScreen("detail");
  };

  const handleMarkDone = (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "good", lastDone: "2026-04-02" } : i));
    setScreen("home");
    setSelectedItem(null);
  };

  if (showOnboarding) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(145deg, #E8E4DC 0%, #D5CFC3 100%)", padding: 20,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <PhoneFrame>
          <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
        </PhoneFrame>
      </div>
    );
  }

  const screenTitles = {
    home: { title: "Upkeep", subtitle: "Your life, maintained" },
    items: { title: "All Items", subtitle: `${items.length} tracked` },
    add: { title: "Add Item", subtitle: null },
    digest: { title: "Digest", subtitle: "Weekly summary" },
    detail: { title: selectedItem?.name || "", subtitle: null },
    profile: { title: "Settings", subtitle: null },
  };

  const current = screenTitles[screen] || screenTitles.home;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(145deg, #E8E4DC 0%, #D5CFC3 100%)", padding: 20,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <PhoneFrame>
        <Header
          title={current.title}
          subtitle={current.subtitle}
          onBack={screen !== "home" ? () => navigate("home") : undefined}
        />

        {screen === "home" && (
          <DashboardScreen items={items} onSelectItem={handleSelectItem} onNavigate={navigate} />
        )}
        {screen === "items" && (
          <AllItemsScreen items={items} filterCategory={filterCategory} onSelectItem={handleSelectItem} />
        )}
        {screen === "detail" && selectedItem && (
          <ItemDetailScreen item={selectedItem} onMarkDone={handleMarkDone} />
        )}
        {screen === "add" && <AddItemScreen />}
        {screen === "digest" && <DigestScreen items={items} />}
        {screen === "profile" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textLight, fontSize: 14 }}>
            Settings screen — coming soon
          </div>
        )}

        <TabBar active={screen === "detail" ? "items" : screen} onNavigate={navigate} />
      </PhoneFrame>
    </div>
  );
}
