import { useState, useEffect } from "react";
import { getTrainingLog, updateTrainingEntry, deleteTrainingEntry } from "./training.js";

const RATING_ICONS = { good: "✅", ok: "⚠️", bad: "❌" };

export default function TrainingManager() {
  const [entries, setEntries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTaskFeedback, setEditTaskFeedback] = useState({});
  const [message, setMessage] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const loadEntries = () => {
    setEntries(getTrainingLog().reverse());
  };

  useEffect(() => { loadEntries(); }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id) => {
    deleteTrainingEntry(id);
    // Also delete from server
    try { await fetch(`/api/training?id=${id}`, { method: "DELETE" }); } catch { /* server sync optional */ }
    loadEntries();
    setExpandedId(null);
    showMessage("success", "Entry deleted");
  };

  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setEditNotes(entry.overallNotes || "");
    const tfMap = {};
    (entry.taskFeedback || []).forEach((tf, i) => { tfMap[i] = tf; });
    setEditTaskFeedback(tfMap);
  };

  const handleSaveEdit = async (entry) => {
    const updates = {
      overallNotes: editNotes || null,
      taskFeedback: Object.values(editTaskFeedback),
    };
    updateTrainingEntry(entry.id, updates);
    // Also update on server
    try {
      await fetch("/api/training", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, updates }),
      });
    } catch { /* server sync optional */ }
    setEditingId(null);
    loadEntries();
    showMessage("success", "Entry updated");
  };

  const handleSuggestImprovements = async () => {
    setSuggesting(true);
    setSuggestion(null);
    try {
      const resp = await fetch("/api/prompt-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingData: entries.slice(0, 50) }),
      });
      const result = await resp.json();
      if (result.suggestedPrompt) {
        setSuggestion(result);
      } else {
        showMessage("error", result.error || "Failed to generate suggestion");
      }
    } catch {
      showMessage("error", "Failed to connect to refinement API");
    }
    setSuggesting(false);
  };

  const handleApproveSuggestion = async () => {
    try {
      const resp = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: suggestion.suggestedPrompt,
          notes: "AI-suggested based on training feedback",
          source: "ai-suggested",
        }),
      });
      const result = await resp.json();
      if (result.success) {
        showMessage("success", `Saved as prompt version ${result.version}`);
        setSuggestion(null);
      }
    } catch {
      showMessage("error", "Failed to save suggested prompt");
    }
  };

  const feedbackSummary = (entry) => {
    const tfs = entry.taskFeedback || [];
    const good = tfs.filter(t => t.rating === "good").length;
    const bad = tfs.filter(t => t.rating === "bad").length;
    const ok = tfs.filter(t => t.rating === "ok").length;
    const parts = [];
    if (good) parts.push(`${good} good`);
    if (ok) parts.push(`${ok} ok`);
    if (bad) parts.push(`${bad} bad`);
    return parts.join(", ") || "No ratings";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #E8E4DC 0%, #D5CFC3 100%)",
      fontFamily: "'DM Sans', 'Avenir', -apple-system, sans-serif",
      padding: "70px 20px 40px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2D5A3D", margin: "0 0 6px", fontFamily: "Georgia, serif" }}>
            Training Log
          </h2>
          <p style={{ fontSize: 13, color: "#9A9A9A", margin: 0 }}>
            {entries.length} entries — browse, edit, or delete training feedback
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600,
            background: message.type === "success" ? "#E8F0EA" : "#FDF0EE",
            color: message.type === "success" ? "#2D5A3D" : "#C44B3F",
            border: `1px solid ${message.type === "success" ? "#2D5A3D33" : "#C44B3F33"}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <a href="/api/training?format=json" download style={{
            padding: "10px 16px", background: "#5A7ABF", color: "#fff",
            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
            textDecoration: "none", textAlign: "center",
          }}>Download JSON</a>
          <a href="/api/training" download style={{
            padding: "10px 16px", background: "#2D5A3D", color: "#fff",
            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
            textDecoration: "none", textAlign: "center",
          }}>Download TXT</a>
          {entries.length >= 3 && (
            <button onClick={handleSuggestImprovements} disabled={suggesting} style={{
              padding: "10px 16px",
              background: suggesting ? "#E8E4DC" : "linear-gradient(135deg, #7B3FBF 0%, #9B5FDF 100%)",
              color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: suggesting ? "default" : "pointer", fontFamily: "inherit",
            }}>
              {suggesting ? "Analyzing..." : "Suggest Prompt Improvements"}
            </button>
          )}
        </div>

        {/* AI Suggestion */}
        {suggestion && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20,
            border: "2px solid #7B3FBF",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>&#10024;</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#7B3FBF" }}>AI Prompt Suggestion</div>
            </div>
            {suggestion.reasoning && (
              <div style={{
                fontSize: 13, color: "#5A5A5A", lineHeight: 1.6, marginBottom: 14,
                padding: "12px 14px", background: "#F0ECF5", borderRadius: 10,
              }}>
                {suggestion.reasoning}
              </div>
            )}
            <textarea
              value={suggestion.suggestedPrompt}
              onChange={e => setSuggestion({ ...suggestion, suggestedPrompt: e.target.value })}
              rows={12}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1px solid #E0DCD4", fontSize: 12, fontFamily: "monospace",
                lineHeight: 1.5, resize: "vertical", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleApproveSuggestion} style={{
                flex: 1, padding: 12, background: "#2D5A3D", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Approve & Save as New Version
              </button>
              <button onClick={() => setSuggestion(null)} style={{
                padding: "12px 16px", background: "#fff", color: "#5A5A5A",
                border: "1px solid #E0DCD4", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Entries */}
        {entries.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", background: "#fff",
            borderRadius: 16, border: "1px solid #E8E4DC",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#128203;</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>No training data yet</div>
            <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 6 }}>
              Scan items in dev mode and submit feedback to build your training log
            </div>
          </div>
        ) : (
          entries.map(entry => {
            const isExpanded = expandedId === entry.id;
            const isEditing = editingId === entry.id;
            return (
              <div key={entry.id} style={{
                background: "#fff", borderRadius: 14, marginBottom: 10,
                border: "1px solid #E8E4DC", overflow: "hidden",
              }}>
                {/* Summary row */}
                <div onClick={() => { setExpandedId(isExpanded ? null : entry.id); setEditingId(null); }} style={{
                  padding: "16px 18px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  {/* Thumbnail */}
                  {entry.inputImage ? (
                    <img
                      src={`data:image/jpeg;base64,${entry.inputImage}`}
                      alt=""
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: 8, background: "#F0EDE7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, flexShrink: 0,
                    }}>&#128247;</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.aiResult?.item || "Unknown"}
                    </div>
                    <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>
                      {feedbackSummary(entry)} &middot; {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                    {entry.identificationFeedback?.correct === false && (
                      <div style={{ fontSize: 11, color: "#C44B3F", marginTop: 2 }}>
                        Identification incorrect{entry.identificationFeedback.correction ? `: ${entry.identificationFeedback.correction}` : ""}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 16, color: "#CCC", transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(90deg)" : "none",
                  }}>&#8250;</span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: "0 18px 18px", borderTop: "1px solid #F0EDE7", paddingTop: 16 }}>
                    {/* OCR text */}
                    {entry.ocrText && (
                      <div style={{
                        fontSize: 12, color: "#5A5A5A", marginBottom: 12,
                        padding: "10px 12px", background: "#F9F8F5", borderRadius: 8,
                      }}>
                        <span style={{ fontWeight: 700 }}>OCR: </span>{entry.ocrText}
                      </div>
                    )}

                    {/* Task feedback */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                      Task Feedback ({(entry.taskFeedback || []).length})
                    </div>
                    {(entry.taskFeedback || []).map((tf, i) => {
                      const isEditingThis = isEditing;
                      return (
                        <div key={i} style={{
                          padding: "10px 12px", background: "#F9F8F5", borderRadius: 8, marginBottom: 6,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14 }}>{RATING_ICONS[tf.rating] || "—"}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", flex: 1 }}>{tf.taskName}</span>
                            {isEditingThis && (
                              <div style={{ display: "flex", gap: 4 }}>
                                {["good", "ok", "bad"].map(r => (
                                  <button key={r} onClick={() => {
                                    setEditTaskFeedback(prev => ({ ...prev, [i]: { ...prev[i], rating: r } }));
                                  }} style={{
                                    padding: "3px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                                    fontSize: 11, fontFamily: "inherit",
                                    background: (editTaskFeedback[i]?.rating || tf.rating) === r
                                      ? (r === "good" ? "#2D5A3D" : r === "bad" ? "#C44B3F" : "#D4932A") : "#E8E4DC",
                                    color: (editTaskFeedback[i]?.rating || tf.rating) === r ? "#fff" : "#5A5A5A",
                                  }}>{RATING_ICONS[r]}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          {tf.feedbackText && (
                            <div style={{ fontSize: 12, color: "#5A5A5A", marginTop: 4, paddingLeft: 22 }}>
                              {tf.feedbackText}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Overall notes */}
                    {isEditing ? (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>Overall Notes:</div>
                        <textarea
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          rows={3}
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            border: "1px solid #E0DCD4", fontSize: 13, fontFamily: "inherit",
                            resize: "vertical", boxSizing: "border-box",
                          }}
                        />
                      </div>
                    ) : entry.overallNotes ? (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Notes:</div>
                        <div style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.6 }}>{entry.overallNotes}</div>
                      </div>
                    ) : null}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(entry)} style={{
                            flex: 1, padding: 10, background: "#2D5A3D", color: "#fff",
                            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                          }}>Save Changes</button>
                          <button onClick={() => setEditingId(null)} style={{
                            padding: "10px 16px", background: "#fff", color: "#5A5A5A",
                            border: "1px solid #E0DCD4", borderRadius: 10, fontSize: 13, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                          }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(entry)} style={{
                            flex: 1, padding: 10, background: "#D4932A", color: "#fff",
                            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                          }}>Edit Feedback</button>
                          <button onClick={() => handleDelete(entry.id)} style={{
                            padding: "10px 16px", background: "#FDF0EE", color: "#C44B3F",
                            border: "1px solid #C44B3F33", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                          }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
