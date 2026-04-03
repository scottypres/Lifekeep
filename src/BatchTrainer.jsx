import { useState, useRef } from "react";
import { TrainingPanel } from "./TrainingPanel.jsx";
import ProductLinks from "./ProductLinks.jsx";

const PRIORITY_STYLES = {
  high: { color: "#C44B3F", bg: "#FDF0EE" },
  medium: { color: "#D4932A", bg: "#FDF6E8" },
  low: { color: "#2D5A3D", bg: "#E8F0EA" },
};

function compressImage(dataUrl, maxDim = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      let result = canvas.toDataURL("image/jpeg", quality);
      if (result.split(",")[1].length > 3500000) {
        result = canvas.toDataURL("image/jpeg", 0.4);
      }
      resolve(result);
    };
    img.src = dataUrl;
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Uses the SAME /api/identify endpoint as Scan Anything
async function scanImage(base64) {
  const resp = await fetch("/api/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, mediaType: "image/jpeg" }),
  });
  const rawText = await resp.text();
  if (!resp.ok) throw new Error(`API ${resp.status}: ${rawText.slice(0, 200)}`);
  const clean = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
}

function ResultCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const schedule = item.result?.maintenanceSchedule || [];
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...schedule].sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

  return (
    <div style={{
      background: "#fff", borderRadius: 16, marginBottom: 12,
      border: item.error ? "2px solid #C44B3F" : "1px solid #E8E4DC",
      overflow: "hidden",
    }}>
      {/* Compact header */}
      <div onClick={() => setExpanded(!expanded)} style={{
        display: "flex", gap: 12, padding: "14px 16px", cursor: "pointer", alignItems: "center",
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={item.preview} alt="" style={{
            width: 56, height: 56, borderRadius: 10, objectFit: "cover",
            border: "1px solid #E8E4DC",
          }} />
          <div style={{
            position: "absolute", top: -4, left: -4,
            background: "#1A1A1A", color: "#fff", fontSize: 10, fontWeight: 700,
            width: 20, height: 20, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>#{index + 1}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {item.status === "scanning" && (
            <div style={{ fontSize: 14, fontWeight: 600, color: "#D4932A" }}>Scanning...</div>
          )}
          {item.status === "queued" && (
            <div style={{ fontSize: 14, fontWeight: 600, color: "#9A9A9A" }}>Queued</div>
          )}
          {item.error && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#C44B3F" }}>Error</div>
              <div style={{ fontSize: 11, color: "#C44B3F", marginTop: 2 }}>{item.error}</div>
            </div>
          )}
          {item.result && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{item.result.item}</div>
              <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>
                {schedule.length} tasks · {item.result.confidence} · {item.result.brand || "Unknown brand"}
              </div>
            </div>
          )}
        </div>
        {item.result && (
          <span style={{
            fontSize: 14, color: "#CCC",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 0.2s", flexShrink: 0,
          }}>›</span>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && item.result && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F0EDE7", paddingTop: 14 }}>
          {/* Quick info */}
          <div style={{
            display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap",
          }}>
            {[
              item.result.brand && ["Brand", item.result.brand],
              item.result.model && ["Model", item.result.model],
              item.result.category && ["Category", item.result.category],
              item.result.lifespanEstimate && ["Lifespan", item.result.lifespanEstimate],
            ].filter(Boolean).map(([label, val]) => (
              <div key={label} style={{
                background: "#F9F8F5", borderRadius: 8, padding: "6px 10px",
              }}>
                <div style={{ fontSize: 10, color: "#9A9A9A", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Maintenance tasks */}
          {sorted.map((task, ti) => {
            const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
            return (
              <div key={ti} style={{
                padding: "12px 14px", background: "#F9F8F5",
                borderRadius: 10, marginBottom: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{task.task}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: p.color, background: p.bg,
                    padding: "2px 8px", borderRadius: 6,
                  }}>{task.priority}</span>
                </div>
                <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 3 }}>
                  {task.interval} · {task.estimatedCost} · {task.difficulty}
                </div>
                {task.products?.map((prod, pi) => (
                  <div key={pi} style={{ marginTop: 8 }}>
                    <ProductLinks query={prod.amazonQuery} name={prod.name} />
                  </div>
                ))}
              </div>
            );
          })}

          {/* Training panel */}
          <div style={{ marginTop: 12 }}>
            {!showTraining ? (
              <button onClick={() => setShowTraining(true)} style={{
                width: "100%", padding: 12,
                background: "#D4932A", color: "#fff", border: "none",
                borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>🎯 Rate This Result</button>
            ) : (
              <TrainingPanel aiResult={item.result} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BatchTrainer() {
  const [items, setItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const fileRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Build queue
    const newItems = [];
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        const compressed = await compressImage(dataUrl);
        newItems.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          filename: file.name,
          preview: compressed,
          base64: compressed.split(",")[1],
          status: "queued",
          result: null,
          error: null,
        });
      } catch (err) {
        newItems.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          filename: file.name,
          preview: null,
          base64: null,
          status: "error",
          result: null,
          error: `Failed to read: ${err.message}`,
        });
      }
    }

    setItems(prev => [...prev, ...newItems]);

    // Process queue
    setProcessing(true);
    const startIdx = items.length; // offset for new items
    for (let i = 0; i < newItems.length; i++) {
      if (!newItems[i].base64) continue;
      const globalIdx = startIdx + i;
      setCurrentIdx(globalIdx);

      // Update status to scanning
      setItems(prev => prev.map((item, idx) =>
        idx === globalIdx ? { ...item, status: "scanning" } : item
      ));

      try {
        const result = await scanImage(newItems[i].base64);
        setItems(prev => prev.map((item, idx) =>
          idx === globalIdx ? { ...item, status: "done", result } : item
        ));
      } catch (err) {
        setItems(prev => prev.map((item, idx) =>
          idx === globalIdx ? { ...item, status: "error", error: err.message } : item
        ));
      }

      // Small delay between scans to avoid rate limits
      if (i < newItems.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setProcessing(false);
    setCurrentIdx(-1);
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const clearAll = () => {
    setItems([]);
    setProcessing(false);
    setCurrentIdx(-1);
  };

  const doneCount = items.filter(i => i.status === "done").length;
  const errorCount = items.filter(i => i.status === "error").length;
  const queuedCount = items.filter(i => i.status === "queued" || i.status === "scanning").length;

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
            <span style={{ fontSize: 13, color: "#D4932A", marginLeft: 10, fontWeight: 600 }}>Batch Training</span>
          </div>
          {items.length > 0 && !processing && (
            <button onClick={clearAll} style={{
              background: "none", border: "1px solid #E0DCD4", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, color: "#9A9A9A", cursor: "pointer", fontFamily: "inherit",
            }}>Clear All</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Upload area */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "24px",
          border: "2px dashed #D4932A", marginBottom: 20, textAlign: "center",
        }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            style={{ display: "none" }}
          />
          <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
            Batch Upload for Training
          </div>
          <div style={{ fontSize: 13, color: "#9A9A9A", marginBottom: 16, lineHeight: 1.6 }}>
            Select multiple photos at once. Each will be scanned through the same AI pipeline as "Scan Anything" — then rate each result to build training data.
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            style={{
              padding: "14px 32px",
              background: processing ? "#E8E4DC" : "linear-gradient(135deg, #D4932A 0%, #C4A265 100%)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 16, fontWeight: 700, cursor: processing ? "default" : "pointer",
              fontFamily: "inherit",
              boxShadow: processing ? "none" : "0 4px 12px rgba(196,162,101,0.3)",
            }}
          >
            {processing ? `Processing ${queuedCount} remaining...` : "Select Images"}
          </button>
          {items.length > 0 && !processing && (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: "block", margin: "10px auto 0",
                padding: "8px 20px", background: "none",
                border: "1px solid #D4932A", borderRadius: 8,
                fontSize: 13, color: "#D4932A", cursor: "pointer", fontFamily: "inherit",
              }}
            >+ Add More Images</button>
          )}
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20,
          }}>
            <div style={{ background: "#E8F0EA", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2D5A3D" }}>{doneCount}</div>
              <div style={{ fontSize: 11, color: "#2D5A3D" }}>Scanned</div>
            </div>
            <div style={{ background: queuedCount > 0 ? "#FDF6E8" : "#fff", borderRadius: 12, padding: "12px 16px", textAlign: "center", border: "1px solid #E8E4DC" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#D4932A" }}>{queuedCount}</div>
              <div style={{ fontSize: 11, color: "#D4932A" }}>{processing ? "Processing" : "Queued"}</div>
            </div>
            <div style={{ background: errorCount > 0 ? "#FDF0EE" : "#fff", borderRadius: 12, padding: "12px 16px", textAlign: "center", border: "1px solid #E8E4DC" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#C44B3F" }}>{errorCount}</div>
              <div style={{ fontSize: 11, color: "#C44B3F" }}>Errors</div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {processing && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#FDF6E8", borderRadius: 12, padding: "14px 18px",
            marginBottom: 16, border: "1px solid #D4932A33",
          }}>
            <div style={{
              width: 24, height: 24, border: "3px solid #F0E6CC",
              borderTopColor: "#D4932A", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", flexShrink: 0,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#D4932A" }}>
                Scanning image {currentIdx + 1} of {items.length}...
              </div>
              <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>
                Using same AI pipeline as Scan Anything · ~$0.03/image
              </div>
            </div>
          </div>
        )}

        {/* Results list */}
        {items.map((item, i) => (
          <ResultCard key={item.id} item={item} index={i} />
        ))}

        {/* Info */}
        {items.length === 0 && (
          <div style={{
            padding: "16px 20px", background: "#E8F0EA",
            borderRadius: 14, fontSize: 13, color: "#2D5A3D", lineHeight: 1.7,
          }}>
            <strong>How batch training works:</strong> Select multiple product photos from your gallery. Each image is sent through the exact same <code style={{ background: "#D5EBD9", padding: "1px 4px", borderRadius: 3 }}>/api/identify</code> endpoint used by "Scan Anything." Results appear as expandable cards — tap any to see full details and rate the AI's output. Prompt improvements from training data apply to both this tool and the regular Scan Anything feature.
          </div>
        )}
      </div>
    </div>
  );
}
