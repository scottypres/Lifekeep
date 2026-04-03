import { useState } from "react";
import { saveTrainingEntry, getTrainingLog, exportTrainingLog, clearTrainingLog } from "./training.js";

export function TrainingPanel({ aiResult, onSaved }) {
  const [identCorrect, setIdentCorrect] = useState(null);
  const [identCorrection, setIdentCorrection] = useState("");
  const [taskFeedback, setTaskFeedback] = useState({});
  const [overallNotes, setOverallNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const schedule = aiResult?.maintenanceSchedule || [];

  const setTaskRating = (i, rating) => {
    setTaskFeedback(prev => ({ ...prev, [i]: { ...prev[i], rating, taskName: schedule[i]?.task } }));
  };

  const setTaskIssue = (i, field, value) => {
    setTaskFeedback(prev => ({ ...prev, [i]: { ...prev[i], [field]: value, taskName: schedule[i]?.task } }));
  };

  const setProductCorrect = (taskIdx, prodIdx, correct) => {
    setTaskFeedback(prev => {
      const existing = prev[taskIdx] || { taskName: schedule[taskIdx]?.task };
      const pf = existing.productFeedback || [];
      pf[prodIdx] = { ...pf[prodIdx], correct, productName: schedule[taskIdx]?.products?.[prodIdx]?.name };
      return { ...prev, [taskIdx]: { ...existing, productFeedback: pf } };
    });
  };

  const setProductCorrection = (taskIdx, prodIdx, correction) => {
    setTaskFeedback(prev => {
      const existing = prev[taskIdx] || { taskName: schedule[taskIdx]?.task };
      const pf = existing.productFeedback || [];
      pf[prodIdx] = { ...pf[prodIdx], correction, productName: schedule[taskIdx]?.products?.[prodIdx]?.name };
      return { ...prev, [taskIdx]: { ...existing, productFeedback: pf } };
    });
  };

  const handleSave = () => {
    saveTrainingEntry({
      aiResult,
      identificationFeedback: {
        correct: identCorrect,
        correction: identCorrection || null,
      },
      taskFeedback: Object.values(taskFeedback),
      overallNotes: overallNotes || null,
    });
    setSaved(true);
    onSaved?.();
  };

  if (saved) {
    return (
      <div style={{
        background: "#E8F0EA", borderRadius: 14, padding: "18px 20px",
        border: "1px solid #2D5A3D33", textAlign: "center",
      }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#2D5A3D" }}>Feedback Saved</div>
        <div style={{ fontSize: 13, color: "#2D5A3D", marginTop: 4 }}>
          {getTrainingLog().length} entries in training log. Export from the home screen.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "20px",
      border: "2px solid #D4932A", marginTop: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🎯</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>Training Feedback</div>
          <div style={{ fontSize: 12, color: "#9A9A9A" }}>Help improve AI accuracy by rating this result</div>
        </div>
      </div>

      {/* Identification Rating */}
      <div style={{
        background: "#F9F8F5", borderRadius: 12, padding: "14px 16px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          Did it correctly identify: "{aiResult?.item}"?
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={() => setIdentCorrect(true)} style={{
            flex: 1, padding: 10, borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 14, fontWeight: 600,
            background: identCorrect === true ? "#2D5A3D" : "#E8E4DC",
            color: identCorrect === true ? "#fff" : "#5A5A5A",
          }}>👍 Correct</button>
          <button onClick={() => setIdentCorrect(false)} style={{
            flex: 1, padding: 10, borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 14, fontWeight: 600,
            background: identCorrect === false ? "#C44B3F" : "#E8E4DC",
            color: identCorrect === false ? "#fff" : "#5A5A5A",
          }}>👎 Wrong</button>
        </div>
        {identCorrect === false && (
          <input
            value={identCorrection}
            onChange={e => setIdentCorrection(e.target.value)}
            placeholder="What is it actually? (e.g., Rheem 4-ton air handler)"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid #E0DCD4", fontSize: 13, fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>

      {/* Task Ratings */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 10 }}>
        Rate each maintenance task:
      </div>
      {schedule.map((task, i) => {
        const fb = taskFeedback[i] || {};
        return (
          <div key={i} style={{
            background: "#F9F8F5", borderRadius: 10, padding: "12px 14px", marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", flex: 1 }}>{task.task}</div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {["good", "ok", "bad"].map(r => (
                  <button key={r} onClick={() => setTaskRating(i, r)} style={{
                    padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 12, fontFamily: "inherit",
                    background: fb.rating === r ? (r === "good" ? "#2D5A3D" : r === "bad" ? "#C44B3F" : "#D4932A") : "#E8E4DC",
                    color: fb.rating === r ? "#fff" : "#5A5A5A",
                  }}>{r === "good" ? "✅" : r === "bad" ? "❌" : "⚠️"}</button>
                ))}
              </div>
            </div>

            {/* Product ratings within task */}
            {task.products?.map((prod, pi) => (
              <div key={pi} style={{
                display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                paddingLeft: 12, fontSize: 12, color: "#5A5A5A",
              }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  🛒 {prod.name}
                </span>
                <button onClick={() => setProductCorrect(i, pi, true)} style={{
                  padding: "2px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11,
                  background: taskFeedback[i]?.productFeedback?.[pi]?.correct === true ? "#2D5A3D" : "#E8E4DC",
                  color: taskFeedback[i]?.productFeedback?.[pi]?.correct === true ? "#fff" : "#5A5A5A",
                }}>✓</button>
                <button onClick={() => setProductCorrect(i, pi, false)} style={{
                  padding: "2px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11,
                  background: taskFeedback[i]?.productFeedback?.[pi]?.correct === false ? "#C44B3F" : "#E8E4DC",
                  color: taskFeedback[i]?.productFeedback?.[pi]?.correct === false ? "#fff" : "#5A5A5A",
                }}>✗</button>
              </div>
            ))}

            {fb.rating === "bad" && (
              <input
                value={fb.correction || ""}
                onChange={e => setTaskIssue(i, "correction", e.target.value)}
                placeholder="What's wrong? (e.g., filter should be 20x20x1)"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 6, marginTop: 8,
                  border: "1px solid #E0DCD4", fontSize: 12, fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>
        );
      })}

      {/* Overall Notes */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
          Additional notes (optional):
        </div>
        <textarea
          value={overallNotes}
          onChange={e => setOverallNotes(e.target.value)}
          placeholder="Anything else the AI got wrong or should know about this product..."
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #E0DCD4", fontSize: 13, fontFamily: "inherit",
            resize: "vertical", boxSizing: "border-box",
          }}
        />
      </div>

      <button onClick={handleSave} style={{
        width: "100%", padding: 14, marginTop: 14,
        background: "#D4932A", color: "#fff", border: "none", borderRadius: 12,
        fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      }}>
        Save Training Feedback
      </button>
    </div>
  );
}

export function TrainingExport() {
  const [copied, setCopied] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const log = getTrainingLog();

  const handleExport = async () => {
    const data = exportTrainingLog();
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = data;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleClear = () => {
    clearTrainingLog();
    setShowConfirmClear(false);
  };

  if (log.length === 0) return null;

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "20px",
      border: "2px solid #D4932A",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🎯</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>Training Log</div>
          <div style={{ fontSize: 12, color: "#9A9A9A" }}>{log.length} scan{log.length !== 1 ? "s" : ""} with feedback</div>
        </div>
      </div>

      {/* Preview of entries */}
      <div style={{ marginBottom: 14 }}>
        {log.slice(-5).map((entry, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px", background: "#F9F8F5", borderRadius: 8, marginBottom: 4,
            fontSize: 12,
          }}>
            <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{entry.aiResult?.item || "Unknown"}</span>
            <span style={{ color: "#9A9A9A" }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleExport} style={{
          flex: 1, padding: 12,
          background: copied ? "#2D5A3D" : "#D4932A",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.2s",
        }}>
          {copied ? "✅ Copied to Clipboard!" : "📋 Export Training Data"}
        </button>
        <button onClick={() => setShowConfirmClear(true)} style={{
          padding: "12px 16px", background: "#F5F3EF", color: "#9A9A9A",
          border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>🗑️</button>
      </div>

      {showConfirmClear && (
        <div style={{
          marginTop: 10, padding: "12px 16px", background: "#FDF0EE",
          borderRadius: 10, display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "#C44B3F", flex: 1 }}>Clear all training data?</span>
          <button onClick={handleClear} style={{
            padding: "6px 14px", background: "#C44B3F", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Clear</button>
          <button onClick={() => setShowConfirmClear(false)} style={{
            padding: "6px 14px", background: "#E8E4DC", color: "#5A5A5A",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
        </div>
      )}

      <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 10, lineHeight: 1.6 }}>
        Tap "Export" to copy all feedback to clipboard, then paste it to Claude to refine the scanning prompts.
      </div>
    </div>
  );
}
