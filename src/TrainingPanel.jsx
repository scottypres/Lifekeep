import { useState } from "react";

const TASK_TEMPLATES = [
  "Wrong specification/size",
  "Wrong part number",
  "Wrong interval — too frequent",
  "Wrong interval — not frequent enough",
  "Not applicable to this product",
  "Missing important maintenance task",
  "Wrong product recommendation",
  "Generic search — needs specific part number",
  "Wrong brand/model identification",
  "Cost estimate is off",
];

const PRODUCT_TEMPLATES = [
  "Wrong size/dimensions",
  "Wrong part number",
  "Search too generic — needs exact spec",
  "Wrong product for this model",
  "Good recommendation",
];

function TemplateSelector({ templates, value, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
        {templates.map((t, i) => (
          <button key={i} onClick={() => onChange(value ? value + "; " + t : t)} style={{
            padding: "4px 10px", borderRadius: 20, border: "1px solid #E0DCD4",
            background: "#fff", fontSize: 11, color: "#5A5A5A", cursor: "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap",
          }}>{t}</button>
        ))}
      </div>
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder="Add details or tap a template above..."
        rows={2}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 8,
          border: "1px solid #E0DCD4", fontSize: 12, fontFamily: "inherit",
          resize: "vertical", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

async function saveToServer(entry) {
  try {
    const resp = await fetch("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    return await resp.json();
  } catch (err) {
    console.error("Server save failed:", err);
    return null;
  }
}

function compressToThumbnail(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 200;
      let w = img.width, h = img.height;
      if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
      else { w = Math.round(w * maxDim / h); h = maxDim; }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.3).split(",")[1]);
    };
    img.onerror = () => resolve(null);
    img.src = "data:image/jpeg;base64," + base64;
  });
}

export function TrainingPanel({ aiResult, inputImage, onSaved }) {
  const [identCorrect, setIdentCorrect] = useState(null);
  const [identCorrection, setIdentCorrection] = useState("");
  const [taskFeedback, setTaskFeedback] = useState({});
  const [overallNotes, setOverallNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverResult, setServerResult] = useState(null);

  const schedule = aiResult?.maintenanceSchedule || [];

  const setTaskRating = (i, rating) => {
    setTaskFeedback(prev => ({ ...prev, [i]: { ...prev[i], rating, taskName: schedule[i]?.task } }));
  };

  const setTaskFeedbackText = (i, feedbackText) => {
    setTaskFeedback(prev => ({ ...prev, [i]: { ...prev[i], feedbackText, taskName: schedule[i]?.task } }));
  };

  const setProductFeedbackText = (taskIdx, prodIdx, feedbackText) => {
    setTaskFeedback(prev => {
      const existing = prev[taskIdx] || { taskName: schedule[taskIdx]?.task };
      const pf = [...(existing.productFeedback || [])];
      pf[prodIdx] = { ...pf[prodIdx], feedbackText, productName: schedule[taskIdx]?.products?.[prodIdx]?.name };
      return { ...prev, [taskIdx]: { ...existing, productFeedback: pf } };
    });
  };

  const setProductCorrect = (taskIdx, prodIdx, correct) => {
    setTaskFeedback(prev => {
      const existing = prev[taskIdx] || { taskName: schedule[taskIdx]?.task };
      const pf = [...(existing.productFeedback || [])];
      pf[prodIdx] = { ...pf[prodIdx], correct, productName: schedule[taskIdx]?.products?.[prodIdx]?.name };
      return { ...prev, [taskIdx]: { ...existing, productFeedback: pf } };
    });
  };



  const handleSave = async () => {
    setSaving(true);

    // Build OCR text from AI result fields
    const ocrParts = [aiResult?.item, aiResult?.brand, aiResult?.model].filter(Boolean);
    const ocrText = ocrParts.join(" — ");

    // Compress input image to thumbnail for storage
    let thumbnail = null;
    if (inputImage) {
      try { thumbnail = await compressToThumbnail(inputImage); } catch { /* optional */ }
    }

    const entry = {
      aiResult,
      inputImage: thumbnail,
      ocrText: ocrText || null,
      identificationFeedback: { correct: identCorrect, correction: identCorrection || null },
      taskFeedback: Object.values(taskFeedback),
      overallNotes: overallNotes || null,
      // Image and OCR data for training context
      inputImage: {
        thumbnail, // compressed JPEG ~20-50KB
        ocrText, // all text the AI read from the label
        imageDescription: `${aiResult?.item || "Unknown"} — ${aiResult?.brand || ""} ${aiResult?.model || ""}`.trim(),
      },
    };

    // Save to localStorage (without thumbnail to save space)
    try {
      const localEntry = { ...entry, inputImage: { ...entry.inputImage, thumbnail: "[saved to server]" } };
      const log = JSON.parse(localStorage.getItem("lifekeep_training_log") || "[]");
      localEntry.id = Date.now().toString(36);
      localEntry.timestamp = new Date().toISOString();
      log.push(localEntry);
      localStorage.setItem("lifekeep_training_log", JSON.stringify(log));
    } catch {}

    // Save to server (with full thumbnail)
    entry.id = Date.now().toString(36);
    entry.timestamp = new Date().toISOString();
    const result = await saveToServer(entry);
    setServerResult(result);
    setSaving(false);
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
          {serverResult?.total ? `${serverResult.total} entries on server.` : "Saved locally."} Download from home screen.
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
          <div style={{ fontSize: 12, color: "#9A9A9A" }}>Rate and correct this result to improve AI accuracy</div>
        </div>
      </div>

      {/* Identification */}
      <div style={{ background: "#F9F8F5", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          Identified as: "{aiResult?.item}"
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
          <input value={identCorrection} onChange={e => setIdentCorrection(e.target.value)}
            placeholder="What is it actually?"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E0DCD4", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
          />
        )}
      </div>

      {/* Task ratings */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 10 }}>
        Maintenance Tasks:
      </div>
      {schedule.map((task, i) => {
        const fb = taskFeedback[i] || {};
        const [showFeedback, setShowFeedback] = useState(false);
        return (
          <div key={i} style={{ background: "#F9F8F5", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
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
            <div style={{ fontSize: 12, color: "#9A9A9A", marginBottom: 4 }}>{task.interval} · {task.estimatedCost}</div>

            {/* Products within task */}
            {task.products?.map((prod, pi) => {
              const pfb = fb.productFeedback?.[pi] || {};
              const [showProdFb, setShowProdFb] = useState(false);
              return (
                <div key={pi} style={{ marginTop: 6, paddingLeft: 8, borderLeft: "2px solid #E0DCD4" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5A5A5A" }}>
                    <span>🛒</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prod.name}</span>
                    <button onClick={() => setProductCorrect(i, pi, true)} style={{
                      padding: "2px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11,
                      background: pfb.correct === true ? "#2D5A3D" : "#E8E4DC",
                      color: pfb.correct === true ? "#fff" : "#5A5A5A",
                    }}>✓</button>
                    <button onClick={() => setProductCorrect(i, pi, false)} style={{
                      padding: "2px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11,
                      background: pfb.correct === false ? "#C44B3F" : "#E8E4DC",
                      color: pfb.correct === false ? "#fff" : "#5A5A5A",
                    }}>✗</button>
                    <button onClick={() => setShowProdFb(!showProdFb)} style={{
                      padding: "2px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11,
                      background: "#E8E4DC", color: "#5A5A5A",
                    }}>💬</button>
                  </div>
                  {showProdFb && (
                    <div style={{ marginTop: 6 }}>
                      <TemplateSelector
                        templates={PRODUCT_TEMPLATES}
                        value={pfb.feedbackText}
                        onChange={v => setProductFeedbackText(i, pi, v)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Task feedback toggle */}
            <button onClick={() => setShowFeedback(!showFeedback)} style={{
              marginTop: 8, padding: "4px 10px", borderRadius: 6, border: "1px solid #E0DCD4",
              background: "#fff", fontSize: 11, color: "#9A9A9A", cursor: "pointer", fontFamily: "inherit",
            }}>💬 {showFeedback ? "Hide" : "Add"} Feedback</button>

            {showFeedback && (
              <div style={{ marginTop: 8 }}>
                <TemplateSelector
                  templates={TASK_TEMPLATES}
                  value={fb.feedbackText}
                  onChange={v => setTaskFeedbackText(i, v)}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Overall */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>Overall notes:</div>
        <textarea value={overallNotes} onChange={e => setOverallNotes(e.target.value)}
          placeholder="Anything else the AI should know..."
          rows={2}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E0DCD4", fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        width: "100%", padding: 14, marginTop: 14,
        background: saving ? "#E8E4DC" : "#D4932A", color: "#fff",
        border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
        cursor: saving ? "default" : "pointer", fontFamily: "inherit",
      }}>
        {saving ? "Saving..." : "Save Training Feedback"}
      </button>
    </div>
  );
}

export function TrainingExport() {
  const [copied, setCopied] = useState(false);
  const [serverCount, setServerCount] = useState(null);

  const localLog = (() => {
    try { return JSON.parse(localStorage.getItem("lifekeep_training_log") || "[]"); } catch { return []; }
  })();

  if (localLog.length === 0 && !serverCount) return null;

  const handleCopyLocal = async () => {
    const { exportTrainingLog } = await import("./training.js");
    const data = exportTrainingLog();
    try {
      await navigator.clipboard.writeText(data);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "20px",
      border: "2px solid #D4932A",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>🎯</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>Training Log</div>
          <div style={{ fontSize: 12, color: "#9A9A9A" }}>{localLog.length} local entries</div>
        </div>
      </div>

      {localLog.slice(-5).map((entry, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between",
          padding: "8px 12px", background: "#F9F8F5", borderRadius: 8, marginBottom: 4, fontSize: 12,
        }}>
          <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{entry.aiResult?.item || "Unknown"}</span>
          <span style={{ color: "#9A9A9A" }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
        </div>
      ))}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleCopyLocal} style={{
            flex: 1, padding: 12,
            background: copied ? "#2D5A3D" : "#D4932A", color: "#fff",
            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {copied ? "✅ Copied!" : "📋 Copy to Clipboard"}
          </button>
          <a href="/api/training?format=json" download style={{
            padding: "12px 16px", background: "#5A7ABF", color: "#fff",
            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
            textDecoration: "none", textAlign: "center",
          }}>⬇ JSON</a>
          <a href="/api/training" download style={{
            padding: "12px 16px", background: "#2D5A3D", color: "#fff",
            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
            textDecoration: "none", textAlign: "center",
          }}>⬇ TXT</a>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 10, lineHeight: 1.6 }}>
        Copy to clipboard for pasting to Claude, or download JSON/TXT from the server.
      </div>
    </div>
  );
}
