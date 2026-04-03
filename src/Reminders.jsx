import { useState, useEffect, useCallback } from "react";
import { getReminders, removeReminder, markDone, clearAllReminders, getStatus, getDaysUntilDue, getNextDueDate } from "./reminders.js";

function amazonLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lifekeep-20`;
}

const CATEGORY_ICONS = {
  appliance: "🏠", vehicle: "🚗", outdoor: "🌿", plumbing: "🔧", electrical: "⚡",
  hvac: "❄️", structure: "🏗️", furniture: "🪑", electronics: "💻", tool: "🛠️",
  sporting: "⚽", other: "📦",
};

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const refresh = useCallback(() => setReminders(getReminders()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleMarkDone = (id) => {
    markDone(id);
    refresh();
  };

  const handleRemove = (id) => {
    removeReminder(id);
    refresh();
  };

  const handleClearAll = () => {
    clearAllReminders();
    refresh();
    setShowClearConfirm(false);
  };

  const sorted = [...reminders].sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
  const overdue = sorted.filter(r => getDaysUntilDue(r) < 0);
  const dueSoon = sorted.filter(r => { const d = getDaysUntilDue(r); return d >= 0 && d <= 14; });
  const onTrack = sorted.filter(r => getDaysUntilDue(r) > 14);
  const score = reminders.length > 0 ? Math.round((onTrack.length / reminders.length) * 100) : 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #F7F5F0 0%, #EDE9E0 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        background: "#fff", borderBottom: "1px solid #E8E4DC",
        padding: "16px 24px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#2D5A3D", fontFamily: "Georgia, serif", letterSpacing: 1 }}>LIFEKEEP</span>
            <span style={{ fontSize: 13, color: "#9A9A9A", marginLeft: 10 }}>My Reminders</span>
          </div>
          {reminders.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} style={{
              background: "none", border: "1px solid #E0DCD4", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, color: "#9A9A9A", cursor: "pointer", fontFamily: "inherit",
            }}>Clear All</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Clear confirm modal */}
        {showClearConfirm && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", maxWidth: 340, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Clear all reminders?</div>
              <div style={{ fontSize: 14, color: "#5A5A5A", marginBottom: 20 }}>This will remove all scheduled maintenance reminders.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, padding: 12, background: "#F5F3EF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#5A5A5A" }}>Cancel</button>
                <button onClick={handleClearAll} style={{ flex: 1, padding: 12, background: "#C44B3F", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#fff" }}>Clear All</button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {reminders.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", fontFamily: "Georgia, serif" }}>No Reminders Yet</div>
            <div style={{ fontSize: 15, color: "#9A9A9A", marginTop: 8, lineHeight: 1.6, maxWidth: 320, margin: "8px auto 0" }}>
              Use the Scan Anything or HVAC Scanner features to identify items, then tap "Schedule Reminder" on any maintenance task.
            </div>
          </div>
        )}

        {reminders.length > 0 && (
          <div>
            {/* Score card */}
            <div style={{
              background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
              borderRadius: 16, padding: "22px 24px", color: "#fff",
              position: "relative", overflow: "hidden", marginBottom: 24,
            }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>Maintenance Score</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }}>{score}</span>
                <span style={{ fontSize: 20, opacity: 0.6 }}>/ 100</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                {onTrack.length} of {reminders.length} items on track
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              <div style={{ background: overdue.length > 0 ? "#FDF0EE" : "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #E8E4DC", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#C44B3F" }}>{overdue.length}</div>
                <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>Overdue</div>
              </div>
              <div style={{ background: dueSoon.length > 0 ? "#FDF6E8" : "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #E8E4DC", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#D4932A" }}>{dueSoon.length}</div>
                <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>Due Soon</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #E8E4DC", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#2D5A3D" }}>{onTrack.length}</div>
                <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>On Track</div>
              </div>
            </div>

            {/* Sections */}
            {[
              { title: "Overdue", items: overdue, icon: "🔴" },
              { title: "Due Soon", items: dueSoon, icon: "🟡" },
              { title: "On Track", items: onTrack, icon: "🟢" },
            ].map(section => section.items.length > 0 && (
              <div key={section.title} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9A9A", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                  {section.icon} {section.title} ({section.items.length})
                </div>
                {section.items.map(reminder => {
                  const status = getStatus(reminder);
                  const nextDue = getNextDueDate(reminder);
                  const isExpanded = expandedId === reminder.id;
                  const catIcon = CATEGORY_ICONS[reminder.itemCategory] || "📦";

                  return (
                    <div key={reminder.id} style={{
                      background: "#fff", borderRadius: 14, marginBottom: 10,
                      border: `1px solid ${status.color}22`, overflow: "hidden",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}>
                      <div onClick={() => setExpandedId(isExpanded ? null : reminder.id)} style={{
                        padding: "16px 20px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 22, flexShrink: 0 }}>{catIcon}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{reminder.task}</div>
                            <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 3 }}>
                              {reminder.itemName} · {reminder.interval}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: status.color, background: status.bg,
                            padding: "4px 10px", borderRadius: 20,
                          }}>
                            {status.days < 0 ? `${Math.abs(status.days)}d overdue` : status.days === 0 ? "Today" : `${status.days}d`}
                          </span>
                          <span style={{ fontSize: 14, color: "#CCC", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F0EDE7", paddingTop: 14 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A5A5A" }}>
                              <span>Next due</span>
                              <span style={{ fontWeight: 600, color: status.color }}>{nextDue.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            {reminder.lastDone && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A5A5A" }}>
                                <span>Last done</span>
                                <span style={{ fontWeight: 600 }}>{new Date(reminder.lastDone).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                            )}
                            {reminder.completions > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A5A5A" }}>
                                <span>Times completed</span>
                                <span style={{ fontWeight: 600 }}>{reminder.completions}</span>
                              </div>
                            )}
                            {reminder.estimatedCost && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A5A5A" }}>
                                <span>Estimated cost</span>
                                <span style={{ fontWeight: 600 }}>{reminder.estimatedCost}</span>
                              </div>
                            )}
                          </div>

                          {/* Amazon links */}
                          {reminder.products && reminder.products.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              {reminder.products.map((p, i) => (
                                <a key={i} href={amazonLink(p.amazonQuery)} target="_blank" rel="noopener noreferrer" style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "12px 14px", background: "#FFF9EE", border: "1px solid #F0E6CC",
                                  borderRadius: 10, textDecoration: "none", color: "#1A1A1A", marginBottom: 6,
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 18 }}>🛒</span>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                                      <div style={{ fontSize: 11, color: "#C4A265", marginTop: 2 }}>Amazon · affiliate link</div>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 13, color: "#C4A265", fontWeight: 600 }}>Shop →</span>
                                </a>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleMarkDone(reminder.id); }} style={{
                              flex: 1, padding: 12, background: "#2D5A3D", color: "#fff", border: "none",
                              borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            }}>✓ Mark Done</button>
                            <button onClick={(e) => { e.stopPropagation(); handleRemove(reminder.id); }} style={{
                              padding: "12px 16px", background: "#F5F3EF", color: "#9A9A9A", border: "none",
                              borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                            }}>🗑️</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
