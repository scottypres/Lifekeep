import { useState, useRef } from "react";
import { saveReminder } from "./reminders.js";
import { TrainingPanel } from "./TrainingPanel.jsx";
import ProductLinks from "./ProductLinks.jsx";

const CATEGORY_ICONS = {
  appliance: "🏠", vehicle: "🚗", outdoor: "🌿", plumbing: "🔧", electrical: "⚡",
  hvac: "❄️", structure: "🏗️", furniture: "🪑", electronics: "💻", tool: "🛠️",
  sporting: "⚽", fitness: "💪", pet: "🐾", "personal-care": "🧴", hobby: "🎨",
  other: "📦",
};

const PRIORITY_STYLES = {
  critical: { color: "#C44B3F", bg: "#FDF0EE", label: "Critical" },
  high: { color: "#D4932A", bg: "#FDF6E8", label: "High" },
  medium: { color: "#5A7ABF", bg: "#F0F4FF", label: "Medium" },
  low: { color: "#9A9A9A", bg: "#F5F5F5", label: "Low" },
};

const DIFFICULTY_STYLES = {
  easy: { color: "#2D5A3D", bg: "#E8F0EA", label: "Easy" },
  moderate: { color: "#D4932A", bg: "#FDF6E8", label: "Moderate" },
  hard: { color: "#C44B3F", bg: "#FDF0EE", label: "Hard" },
  "professional-only": { color: "#7B6B9E", bg: "#F0ECF5", label: "Pro Only" },
  diy: { color: "#2D5A3D", bg: "#E8F0EA", label: "DIY" },
  professional: { color: "#7B6B9E", bg: "#F0ECF5", label: "Professional" },
};

function MaintenanceCard({ task, itemInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const difficulty = DIFFICULTY_STYLES[task.difficulty] || DIFFICULTY_STYLES.diy;

  const handleSchedule = (e) => {
    e.stopPropagation();
    saveReminder({
      task: task.task,
      interval: task.interval,
      priority: task.priority,
      difficulty: task.difficulty,
      estimatedCost: task.estimatedCost,
      description: task.description,
      products: task.products || [],
      itemName: itemInfo?.item || "Unknown Item",
      itemBrand: itemInfo?.brand,
      itemModel: itemInfo?.model,
      itemCategory: itemInfo?.category || "other",
    });
    setScheduled(true);
    setTimeout(() => setScheduled(false), 2000);
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 14, marginBottom: 10,
      border: "1px solid #E8E4DC", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "18px 20px", cursor: "pointer",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: priority.color, background: priority.bg,
              padding: "3px 8px", borderRadius: 6,
            }}>{priority.label}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: difficulty.color, background: difficulty.bg,
              padding: "3px 8px", borderRadius: 6,
            }}>{difficulty.label}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginTop: 8 }}>
            {task.task}
          </div>
          <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 4 }}>
            {task.interval}{task.estimatedCost ? ` · ${task.estimatedCost}` : ""}
          </div>
        </div>
        <span style={{
          fontSize: 16, color: "#CCC", transition: "transform 0.2s",
          transform: expanded ? "rotate(90deg)" : "none", flexShrink: 0, marginTop: 4,
        }}>›</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F0EDE7", paddingTop: 16 }}>
          {/* Description */}
          <div style={{
            fontSize: 14, color: "#5A5A5A", lineHeight: 1.7, marginBottom: 16,
            padding: "12px 14px", background: "#F9F8F5", borderRadius: 10,
          }}>
            {task.description}
          </div>

          {/* Products */}
          {task.products && task.products.length > 0 && (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#9A9A9A", letterSpacing: 1,
                marginBottom: 10, textTransform: "uppercase",
              }}>
                Products Needed ({task.products.length})
              </div>
              {task.products.map((product, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <ProductLinks query={product.amazonQuery} name={product.name} />
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={handleSchedule} disabled={scheduled} style={{
              flex: 1, padding: 14,
              background: scheduled ? "#E8F0EA" : "#2D5A3D",
              color: scheduled ? "#2D5A3D" : "#fff",
              border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: scheduled ? "default" : "pointer",
              fontFamily: "inherit", transition: "all 0.2s",
            }}>
              {scheduled ? "✓ Scheduled!" : "🔔 Remind Me"}
            </button>
            {task.serviceOption && (
              <button onClick={(e) => {
                e.stopPropagation();
                const query = encodeURIComponent(`${task.task} ${itemInfo?.item || ""} service near me`);
                window.open(`https://www.google.com/search?q=${query}`, "_blank");
              }} style={{
                padding: "14px 16px",
                background: "#F0ECF5", color: "#7B6B9E",
                border: "none", borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
                📞 Find Service
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UniversalScanner({ mode }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("");
  const [filter, setFilter] = useState("all");
  const [allScheduled, setAllScheduled] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-20250514");
  // Multi-model state
  const [allResults, setAllResults] = useState({}); // { modelId: { data, elapsed, error } }
  const [activeResultModel, setActiveResultModel] = useState(null);
  const [multiLoading, setMultiLoading] = useState(new Set()); // models currently loading
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const MODEL_OPTIONS = [
    { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "Anthropic" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", provider: "Anthropic" },
    { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
  ];

  const isAllMode = selectedModel === "all";

  const addLog = (msg) => setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const compressImage = (dataUrl, maxDim = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        addLog(`Original dimensions: ${width}x${height}`);
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          addLog(`Resized to: ${width}x${height}`);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        addLog(`Compressed size: ${(compressed.length / 1024).toFixed(1)}KB (quality: ${quality})`);
        resolve(compressed);
      };
      img.src = dataUrl;
    });
  };

  const handleFile = (e) => {
    try {
      setDebugLog([]);
      addLog("handleFile triggered");
      const file = e.target.files?.[0];
      if (!file) { addLog("No file selected"); return; }
      addLog(`File: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(1)}KB`);
      setError(null); setResult(null);
      const reader = new FileReader();
      reader.onerror = () => {
        addLog(`FileReader error: ${reader.error}`);
        setError(`FileReader error: ${reader.error}`);
      };
      reader.onload = async () => {
        try {
          addLog(`FileReader done, raw size: ${(reader.result?.length / 1024).toFixed(1)}KB`);
          setPreview(reader.result);

          addLog("Compressing image...");
          const compressed = await compressImage(reader.result);
          const base64 = compressed.split(",")[1];
          addLog(`Final base64: ${(base64.length / 1024).toFixed(1)}KB`);

          if (base64.length > 3500000) {
            addLog("Still too large, recompressing at lower quality...");
            const smaller = await compressImage(reader.result, 800, 0.5);
            const smallBase64 = smaller.split(",")[1];
            addLog(`Recompressed: ${(smallBase64.length / 1024).toFixed(1)}KB`);
            setImage({ base64: smallBase64, mediaType: "image/jpeg" });
          } else {
            setImage({ base64, mediaType: "image/jpeg" });
          }
          addLog("Ready to scan");
        } catch (err) {
          addLog(`reader.onload error: ${err.name}: ${err.message}`);
          setError(`File processing: ${err.name}: ${err.message}`);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      addLog(`handleFile error: ${err.name}: ${err.message}`);
      setError(`File select: ${err.name}: ${err.message}`);
    }
  };

  const scanOneModel = async (modelId, apiKeys) => {
    const modelLabel = MODEL_OPTIONS.find(m => m.id === modelId)?.label || modelId;
    const startTime = Date.now();
    const bodyStr = JSON.stringify({ image: image.base64, mediaType: image.mediaType, model: modelId, apiKeys });
    const resp = await fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyStr,
    });
    const rawText = await resp.text();
    const elapsed = Date.now() - startTime;
    addLog(`[${modelLabel}] HTTP ${resp.status}, body length: ${rawText.length}`);
    addLog(`[${modelLabel}] Response preview: ${rawText.slice(0, 250)}`);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      addLog(`[${modelLabel}] JSON parse failed on response: ${parseErr.message}`);
      throw new Error(`Response not JSON: ${rawText.slice(0, 200)}`);
    }

    if (!resp.ok) {
      addLog(`[${modelLabel}] API error: ${data.error || resp.status}`);
      throw new Error(data.error || `Server ${resp.status}`);
    }
    if (data.error && !data.maintenanceSchedule) {
      addLog(`[${modelLabel}] Data error: ${data.error}`);
      if (data._debug) addLog(`[${modelLabel}] Debug: len=${data._debug.textLength}, first="${data._debug.firstChars}", last="${data._debug.lastChars}"`);
      if (data.raw) addLog(`[${modelLabel}] Raw model output: ${data.raw.slice(0, 300)}`);
      throw new Error(data.error);
    }
    addLog(`[${modelLabel}] Parsed OK — item: ${data.item || "?"}, tasks: ${data.maintenanceSchedule?.length || 0}`);
    return { data, elapsed };
  };

  const handleScanAll = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);
    setAllResults({}); setActiveResultModel(null);
    addLog("=== SCAN ALL MODELS ===");

    let apiKeys = {};
    try { apiKeys = JSON.parse(localStorage.getItem("lifekeep_llm_keys") || "{}"); } catch {}

    const running = new Set(MODEL_OPTIONS.map(m => m.id));
    setMultiLoading(running);
    setPhase(`Scanning with ${MODEL_OPTIONS.length} models...`);

    const promises = MODEL_OPTIONS.map(async (m) => {
      addLog(`[${m.label}] Starting...`);
      try {
        const { data, elapsed } = await scanOneModel(m.id, apiKeys);
        addLog(`[${m.label}] OK in ${elapsed}ms — ${data.maintenanceSchedule?.length || 0} tasks`);
        setAllResults(prev => ({ ...prev, [m.id]: { data, elapsed, error: null } }));
        // Auto-select first successful result
        setActiveResultModel(prev => prev || m.id);
      } catch (err) {
        addLog(`[${m.label}] FAILED: ${err.message}`);
        setAllResults(prev => ({ ...prev, [m.id]: { data: null, elapsed: 0, error: err.message } }));
      } finally {
        setMultiLoading(prev => { const next = new Set(prev); next.delete(m.id); return next; });
      }
    });

    await Promise.allSettled(promises);
    setLoading(false); setPhase("");
    addLog("=== ALL MODELS DONE ===");
  };

  const handleScan = async () => {
    if (!image) { addLog("No image"); return; }

    if (isAllMode) return handleScanAll();

    setLoading(true); setError(null); setResult(null);
    setAllResults({}); setActiveResultModel(null);
    addLog("=== SCAN START ===");

    try {
      addLog(`base64 length: ${image.base64?.length}, type: ${image.mediaType}`);
      setPhase("Preparing request...");

      addLog(`Model: ${selectedModel}`);
      let apiKeys = {};
      try { apiKeys = JSON.parse(localStorage.getItem("lifekeep_llm_keys") || "{}"); } catch {}

      let bodyStr;
      try {
        bodyStr = JSON.stringify({ image: image.base64, mediaType: image.mediaType, model: selectedModel, apiKeys });
        addLog(`JSON body size: ${(bodyStr.length / 1024).toFixed(1)}KB`);
      } catch (jsonErr) {
        addLog(`JSON.stringify failed: ${jsonErr.name}: ${jsonErr.message}`);
        throw jsonErr;
      }

      setPhase("Sending to /api/identify...");
      addLog("fetch starting...");

      let resp;
      try {
        resp = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyStr,
        });
        addLog(`fetch done — status: ${resp.status} ${resp.statusText}`);
        addLog(`content-type: ${resp.headers.get("content-type")}`);
      } catch (fetchErr) {
        addLog(`fetch threw: ${fetchErr.name}: ${fetchErr.message}`);
        throw new Error(`Network error: ${fetchErr.name}: ${fetchErr.message}`);
      }

      setPhase("Reading response...");
      let rawText;
      try {
        rawText = await resp.text();
        addLog(`body length: ${rawText.length}`);
        addLog(`body preview: ${rawText.slice(0, 300)}`);
      } catch (textErr) {
        addLog(`resp.text() threw: ${textErr.name}: ${textErr.message}`);
        throw new Error(`Response read error: ${textErr.name}: ${textErr.message}`);
      }

      let data;
      try {
        data = JSON.parse(rawText);
        addLog("JSON parsed OK");
      } catch (parseErr) {
        addLog(`JSON.parse failed: ${parseErr.message}`);
        throw new Error(`Not JSON (status ${resp.status}): ${rawText.slice(0, 500)}`);
      }

      if (!resp.ok) {
        addLog(`API error: ${data.error || resp.status}`);
        throw new Error(data.error || `Server ${resp.status}`);
      }
      if (data.error && !data.maintenanceSchedule) {
        addLog(`Data error: ${data.error}`);
        throw new Error(data.error);
      }

      addLog(`SUCCESS — ${data.maintenanceSchedule?.length || 0} tasks, item: ${data.item}`);
      setResult(data);
    } catch (err) {
      addLog(`FAILED: ${err.name}: ${err.message}`);
      setError(`${err.name}: ${err.message}`);
    } finally {
      setLoading(false); setPhase("");
      addLog("=== SCAN END ===");
    }
  };

  const reset = () => {
    setImage(null); setPreview(null); setResult(null); setError(null); setPhase(""); setFilter("all"); setAllScheduled(false);
  };

  const schedule = result?.maintenanceSchedule || [];
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedSchedule = [...schedule].sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
  const priorities = [...new Set(sortedSchedule.map(s => s.priority))];
  const filtered = (filter === "all" ? sortedSchedule : sortedSchedule.filter(s => s.priority === filter));
  const totalProducts = schedule.reduce((sum, t) => sum + (t.products?.length || 0), 0);
  const catIcon = CATEGORY_ICONS[result?.category] || "📦";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #F7F5F0 0%, #EDE9E0 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E8E4DC",
        padding: "16px 24px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#2D5A3D", fontFamily: "Georgia, serif", letterSpacing: 1 }}>LIFEKEEP</span>
            <span style={{ fontSize: 13, color: "#9A9A9A", marginLeft: 10 }}>Scan Anything</span>
          </div>
          {(preview || result) && (
            <button onClick={reset} style={{
              background: "none", border: "1px solid #E0DCD4", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, color: "#5A5A5A", cursor: "pointer", fontFamily: "inherit",
            }}>New Scan</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* ─── Intro ─── */}
        {!preview && !result && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 32, marginTop: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", margin: 0, fontFamily: "Georgia, serif" }}>
                Scan Anything
              </h1>
              <p style={{ fontSize: 15, color: "#9A9A9A", marginTop: 8, lineHeight: 1.5, maxWidth: 400, margin: "8px auto 0" }}>
                Take a photo of any item you own and get a complete maintenance schedule with links to every product you'll need
              </p>
            </div>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <button onClick={() => cameraRef.current?.click()} style={{
              width: "100%", padding: "28px 24px",
              background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
              border: "none", borderRadius: 16, cursor: "pointer", color: "#fff", textAlign: "center",
              boxShadow: "0 4px 16px rgba(45,90,61,0.3)", marginBottom: 12,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Take Photo</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Point at anything you own</div>
            </button>

            <button onClick={() => fileRef.current?.click()} style={{
              width: "100%", padding: "20px 24px",
              background: "#fff", border: "2px solid #E0DCD4",
              borderRadius: 16, cursor: "pointer", textAlign: "center", marginBottom: 24,
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#2D5A3D" }}>Upload from Gallery</div>
            </button>

            {/* Examples grid */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                Works with anything
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { icon: "🏠", label: "HVAC / Furnace", desc: "Filters, belts, parts" },
                  { icon: "🚗", label: "Car / Truck", desc: "Fluids, filters, brakes" },
                  { icon: "🌿", label: "Lawn Mower", desc: "Oil, blades, plugs" },
                  { icon: "🍳", label: "Kitchen Appliance", desc: "Filters, gaskets, cleaning" },
                  { icon: "🏊", label: "Pool / Hot Tub", desc: "Chemicals, filters, pumps" },
                  { icon: "🔧", label: "Power Tools", desc: "Blades, brushes, lube" },
                  { icon: "🚲", label: "Bicycle", desc: "Chain, tires, brake pads" },
                  { icon: "💧", label: "Water Heater", desc: "Anode rod, flush, valves" },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: "#fff", borderRadius: 12, padding: "14px 16px",
                    border: "1px solid #E8E4DC",
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: "14px 20px", background: "#E8F0EA", borderRadius: 14,
              fontSize: 13, color: "#2D5A3D", lineHeight: 1.7,
            }}>
              <strong>AI-powered demo:</strong> Claude's vision API identifies the item, determines every maintenance task it needs, estimates intervals and costs, and generates specific product links. This demonstrates how Lifekeep could work with any product, not just pre-loaded categories.
            </div>
          </div>
        )}

        {/* ─── Preview ─── */}
        {preview && !result && !loading && (
          <div>
            <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 20, border: "2px solid #E8E4DC" }}>
              <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#f5f5f5" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#5A5A5A", display: "block", marginBottom: 6 }}>
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1px solid #E0DCD4", background: "#fff", fontSize: 14,
                  fontFamily: "inherit", color: "#1A1A1A", cursor: "pointer",
                  appearance: "auto",
                }}
              >
                <option value="all">All Models (compare)</option>
                <optgroup label="─────────" disabled />
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleScan} style={{
              width: "100%", padding: "18px", background: "#2D5A3D", color: "#fff",
              border: "none", borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", boxShadow: "0 4px 16px rgba(45,90,61,0.3)",
            }}>
              Identify & Find Maintenance
            </button>
            {error && (
              <div style={{ marginTop: 16, padding: "14px 20px", background: "#FDF0EE", borderRadius: 12, fontSize: 13, color: "#C44B3F", lineHeight: 1.6, wordBreak: "break-word" }}>{error}</div>
            )}
            {debugLog.length > 0 && (
              <div style={{ marginTop: 12, padding: "14px 16px", background: "#1A1A1A", borderRadius: 12, maxHeight: 300, overflowY: "auto" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", marginBottom: 8, letterSpacing: 1 }}>DEBUG LOG</div>
                {debugLog.map((log, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace", lineHeight: 1.8, wordBreak: "break-all" }}>{log}</div>
                ))}
              </div>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => { reset(); handleFile(e); }} style={{ display: "none" }} />
            <button onClick={() => { reset(); setTimeout(() => cameraRef.current?.click(), 100); }} style={{
              width: "100%", padding: "14px", marginTop: 10, background: "none",
              border: "1px solid #E0DCD4", borderRadius: 14, fontSize: 14, color: "#5A5A5A",
              cursor: "pointer", fontFamily: "inherit",
            }}>Retake Photo</button>
          </div>
        )}

        {/* ─── Loading ─── */}
        {loading && (
          <div>
            {preview && (
              <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 24, border: "2px solid #2D5A3D", opacity: 0.6 }}>
                <img src={preview} alt="Scanning" style={{ width: "100%", maxHeight: 250, objectFit: "contain", background: "#f5f5f5" }} />
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 52, height: 52, border: "4px solid #E8E4DC", borderTopColor: "#2D5A3D",
                borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#1A1A1A" }}>{phase}</div>
              <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 6 }}>
                {isAllMode ? "Running all models in parallel" : "AI is analyzing your photo"}
              </div>
              {/* Per-model progress for all-models mode */}
              {isAllMode && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
                  {MODEL_OPTIONS.map((m) => {
                    const r = allResults[m.id];
                    const still = multiLoading.has(m.id);
                    return (
                      <div key={m.id} style={{
                        padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: r?.error ? "#FDF0EE" : r?.data ? "#E8F0EA" : "#F5F5F5",
                        color: r?.error ? "#C44B3F" : r?.data ? "#2D5A3D" : "#999",
                      }}>
                        {m.label.split(" ")[0]}{" "}
                        {still ? "..." : r?.error ? "✗" : r?.data ? `✓ ${(r.elapsed / 1000).toFixed(1)}s` : "—"}
                      </div>
                    );
                  })}
                </div>
              )}
              {debugLog.length > 0 && (
                <div style={{ marginTop: 20, padding: "14px 16px", background: "#1A1A1A", borderRadius: 12, maxHeight: 250, overflowY: "auto", textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", marginBottom: 8, letterSpacing: 1 }}>DEBUG LOG</div>
                  {debugLog.map((log, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace", lineHeight: 1.8, wordBreak: "break-all" }}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Multi-model results tab bar ─── */}
        {Object.keys(allResults).length > 0 && !loading && (
          <div>
            {/* Image thumbnail */}
            {preview && (
              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1px solid #E8E4DC", maxHeight: 140 }}>
                <img src={preview} alt="Scanned" style={{ width: "100%", maxHeight: 140, objectFit: "contain", background: "#f5f5f5" }} />
              </div>
            )}

            {/* Model tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {MODEL_OPTIONS.map((m) => {
                const r = allResults[m.id];
                const isActive = activeResultModel === m.id;
                const isLoading = multiLoading.has(m.id);
                const hasError = r?.error;
                const hasData = r?.data;
                return (
                  <button
                    key={m.id}
                    onClick={() => { if (hasData) { setActiveResultModel(m.id); setResult(r.data); setError(null); } }}
                    disabled={!hasData && !isLoading}
                    style={{
                      padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      cursor: hasData ? "pointer" : "default",
                      fontFamily: "inherit", transition: "all 0.15s",
                      border: isActive ? "2px solid #2D5A3D" : "1px solid #E0DCD4",
                      background: isActive ? "#2D5A3D" : hasError ? "#FDF0EE" : hasData ? "#fff" : "#F5F5F5",
                      color: isActive ? "#fff" : hasError ? "#C44B3F" : hasData ? "#1A1A1A" : "#CCC",
                    }}
                  >
                    <div>{m.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>
                      {isLoading ? "Running..." : hasError ? "Error" : hasData ? `${(r.elapsed / 1000).toFixed(1)}s` : "—"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Show error for active model if it errored */}
            {activeResultModel && allResults[activeResultModel]?.error && (
              <div style={{ padding: "14px 20px", background: "#FDF0EE", borderRadius: 12, fontSize: 13, color: "#C44B3F", lineHeight: 1.6, marginBottom: 16 }}>
                {MODEL_OPTIONS.find(m => m.id === activeResultModel)?.label}: {allResults[activeResultModel].error}
              </div>
            )}

            {/* Scan again */}
            <button onClick={() => { setResult(null); setAllResults({}); setActiveResultModel(null); setError(null); }} style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid #E0DCD4",
              background: "#fff", fontSize: 12, color: "#777", cursor: "pointer",
              fontFamily: "inherit", marginBottom: 16,
            }}>
              Scan Again
            </button>
          </div>
        )}

        {/* ─── Results ─── */}
        {result && (
          <div>
            {/* Image thumbnail */}
            {preview && (
              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1px solid #E8E4DC", maxHeight: 180 }}>
                <img src={preview} alt="Scanned" style={{ width: "100%", maxHeight: 180, objectFit: "contain", background: "#f5f5f5" }} />
              </div>
            )}

            {/* Identification card */}
            <div style={{
              background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
              borderRadius: 16, padding: "24px 24px 20px", color: "#fff",
              position: "relative", overflow: "hidden", marginBottom: 20,
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", bottom: -40, right: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
              <div style={{ fontSize: 36, marginBottom: 8 }}>{catIcon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>Identified</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{result.item}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                {result.brand && (
                  <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Brand</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{result.brand}</div></div>
                )}
                {result.model && (
                  <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Model</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{result.model}</div></div>
                )}
                {result.lifespanEstimate && (
                  <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Lifespan</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{result.lifespanEstimate}</div></div>
                )}
                {result.confidence && (
                  <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Confidence</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, textTransform: "capitalize" }}>{result.confidence}</div></div>
                )}
                {result._meta && (
                  <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Model</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{MODEL_OPTIONS.find(m => m.id === result._meta.model)?.label || result._meta.model}{result._meta.elapsed ? ` (${(result._meta.elapsed / 1000).toFixed(1)}s)` : ""}</div></div>
                )}
              </div>
            </div>

            {/* Condition */}
            {result.condition && (
              <div style={{
                background: "#FBF6ED", borderRadius: 14, padding: "14px 18px",
                border: "1px solid #C4A26533", marginBottom: 16,
                fontSize: 14, color: "#5A5A5A", lineHeight: 1.6,
              }}>
                <span style={{ fontWeight: 700, color: "#C4A265" }}>Condition: </span>{result.condition}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[
                { label: "Maint. Tasks", value: schedule.length, color: "#2D5A3D" },
                { label: "Products", value: totalProducts, color: "#C4A265" },
                { label: "AI Cost", value: "~$0.03", color: "#5B8FA8" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#fff", borderRadius: 12, padding: "14px 16px",
                  border: "1px solid #E8E4DC", textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Priority filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => setFilter("all")} style={{
                padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                background: filter === "all" ? "#2D5A3D" : "#fff", color: filter === "all" ? "#fff" : "#5A5A5A",
              }}>All ({schedule.length})</button>
              {priorities.map(p => {
                const s = PRIORITY_STYLES[p] || PRIORITY_STYLES.medium;
                const count = schedule.filter(t => t.priority === p).length;
                return (
                  <button key={p} onClick={() => setFilter(p)} style={{
                    padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                    background: filter === p ? s.color : "#fff", color: filter === p ? "#fff" : "#5A5A5A",
                  }}>{p} ({count})</button>
                );
              })}
            </div>

            {/* Schedule */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
              Maintenance Schedule · {filtered.length} tasks
            </div>
            {filtered.map((task, i) => <MaintenanceCard key={i} task={task} index={i} itemInfo={result} />)}

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <div style={{
                marginTop: 20, background: "#FBF6ED", borderRadius: 14, padding: "18px 20px",
                border: "1px solid #C4A26533",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C4A265", marginBottom: 10 }}>💡 Pro Tips</div>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    marginBottom: i < result.tips.length - 1 ? 8 : 0,
                  }}>
                    <span style={{ fontSize: 12, color: "#C4A265", flexShrink: 0, marginTop: 2 }}>✦</span>
                    <span style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.6 }}>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule All Reminders */}
            <div style={{
              marginTop: 20, background: "#fff", borderRadius: 14, padding: "20px",
              border: "2px solid #2D5A3D",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
                🔔 Track This Item
              </div>
              <div style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.6, marginBottom: 14 }}>
                Schedule recurring reminders for all {schedule.length} maintenance tasks. You'll be notified when each one is due.
              </div>
              <button onClick={() => {
                schedule.forEach(task => {
                  saveReminder({
                    task: task.task, interval: task.interval, priority: task.priority,
                    difficulty: task.difficulty, estimatedCost: task.estimatedCost,
                    description: task.description, products: task.products || [],
                    itemName: result?.item || "Unknown", itemBrand: result?.brand,
                    itemModel: result?.model, itemCategory: result?.category || "other",
                  });
                });
                setAllScheduled(true);
              }} disabled={allScheduled} style={{
                width: "100%", padding: 16,
                background: allScheduled ? "#E8F0EA" : "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
                color: allScheduled ? "#2D5A3D" : "#fff",
                border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: allScheduled ? "default" : "pointer",
                fontFamily: "inherit", transition: "all 0.3s",
                boxShadow: allScheduled ? "none" : "0 4px 12px rgba(45,90,61,0.3)",
              }}>
                {allScheduled ? `✓ All ${schedule.length} Reminders Scheduled!` : `Schedule All ${schedule.length} Reminders`}
              </button>
              {allScheduled && (
                <div style={{
                  marginTop: 12, padding: "12px 16px", background: "#E8F0EA", borderRadius: 10,
                  fontSize: 13, color: "#2D5A3D", textAlign: "center", lineHeight: 1.6,
                }}>
                  View your reminders dashboard from the home screen to track due dates, mark completions, and shop for parts.
                </div>
              )}
            </div>

            {/* Training Feedback — dev mode only */}
            {mode === "dev" && <TrainingPanel aiResult={result} inputImage={image?.base64} />}

            {/* Scan another */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => { reset(); handleFile(e); }} style={{ display: "none" }} />
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { reset(); handleFile(e); }} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => cameraRef.current?.click()} style={{
                flex: 1, padding: "14px", background: "#2D5A3D", color: "#fff", border: "none",
                borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>📸 Scan Another</button>
              <button onClick={() => fileRef.current?.click()} style={{
                flex: 1, padding: "14px", background: "#fff", color: "#5A5A5A",
                border: "1px solid #E0DCD4", borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>🖼️ Upload Another</button>
            </div>

            <div style={{
              marginTop: 16, padding: "14px 20px", background: "#E8F0EA",
              borderRadius: 14, fontSize: 13, color: "#2D5A3D", lineHeight: 1.7,
            }}>
              <strong>This is a demo</strong> of Lifekeep's AI product intelligence. In production, results would be cached per product model — scan once, maintain forever. Every affiliate link is auto-generated from the AI's analysis.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
