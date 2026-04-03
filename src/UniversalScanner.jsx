import { useState, useRef } from "react";

function amazonLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lifekeep-20`;
}

const CATEGORY_ICONS = {
  appliance: "🏠", vehicle: "🚗", outdoor: "🌿", plumbing: "🔧", electrical: "⚡",
  hvac: "❄️", structure: "🏗️", furniture: "🪑", electronics: "💻", tool: "🛠️",
  sporting: "⚽", other: "📦",
};

const PRIORITY_STYLES = {
  high: { color: "#C44B3F", bg: "#FDF0EE", label: "High Priority" },
  medium: { color: "#D4932A", bg: "#FDF6E8", label: "Medium" },
  low: { color: "#2D5A3D", bg: "#E8F0EA", label: "Low" },
};

const DIFFICULTY_STYLES = {
  diy: { color: "#2D5A3D", bg: "#E8F0EA", label: "🔧 DIY" },
  professional: { color: "#7B6B9E", bg: "#F0ECF5", label: "👷 Professional" },
};

function MaintenanceCard({ task, index }) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const difficulty = DIFFICULTY_STYLES[task.difficulty] || DIFFICULTY_STYLES.diy;

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
                <a
                  key={i}
                  href={amazonLink(product.amazonQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", background: "#FFF9EE",
                    border: "1px solid #F0E6CC", borderRadius: 12,
                    textDecoration: "none", color: "#1A1A1A",
                    marginBottom: 8, transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>🛒</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: 11, color: "#C4A265", marginTop: 3 }}>
                        Amazon · affiliate link
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: "#C4A265", fontWeight: 700, flexShrink: 0, marginLeft: 10 }}>Shop →</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UniversalScanner() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("");
  const [filter, setFilter] = useState("all");
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setImage({ base64: reader.result.split(",")[1], mediaType: file.type || "image/jpeg" });
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);

    try {
      setPhase("Uploading image...");
      await new Promise(r => setTimeout(r, 400));
      setPhase("Identifying item...");
      
      const resp = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.base64, mediaType: image.mediaType }),
      });

      setPhase("Building maintenance schedule...");
      await new Promise(r => setTimeout(r, 300));
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || `Server error ${resp.status}`);
      if (data.error && !data.maintenanceSchedule) throw new Error(data.error);

      setPhase("Generating product links...");
      await new Promise(r => setTimeout(r, 200));
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); setPhase("");
    }
  };

  const reset = () => {
    setImage(null); setPreview(null); setResult(null); setError(null); setPhase(""); setFilter("all");
  };

  const schedule = result?.maintenanceSchedule || [];
  const priorities = [...new Set(schedule.map(s => s.priority))];
  const filtered = filter === "all" ? schedule : schedule.filter(s => s.priority === filter);
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
            <button onClick={handleScan} style={{
              width: "100%", padding: "18px", background: "#2D5A3D", color: "#fff",
              border: "none", borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", boxShadow: "0 4px 16px rgba(45,90,61,0.3)",
            }}>
              Identify & Find Maintenance
            </button>
            {error && (
              <div style={{ marginTop: 16, padding: "14px 20px", background: "#FDF0EE", borderRadius: 12, fontSize: 13, color: "#C44B3F", lineHeight: 1.6 }}>{error}</div>
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
              <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 6 }}>AI is analyzing your photo</div>
            </div>
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
            {filtered.map((task, i) => <MaintenanceCard key={i} task={task} index={i} />)}

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
