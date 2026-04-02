import { useState, useRef } from "react";

const CATEGORY_META = {
  fluid: { icon: "🛢️", color: "#5B8FA8" },
  filter: { icon: "🔲", color: "#6B8C5E" },
  tire: { icon: "🔄", color: "#8B7355" },
  brake: { icon: "🛑", color: "#C44B3F" },
  ignition: { icon: "⚡", color: "#D4932A" },
  belt: { icon: "〰️", color: "#7B6B9E" },
  wiper: { icon: "🌧️", color: "#5A8FAD" },
  electrical: { icon: "🔋", color: "#C4A265" },
  drivetrain: { icon: "⚙️", color: "#7B6B9E" },
  other: { icon: "🔧", color: "#888" },
};

function amazonLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lifekeep-20`;
}

function getMileageStatus(item, currentMiles) {
  if (!item.intervalMiles || !currentMiles) return null;
  const nextDue = Math.ceil(currentMiles / item.intervalMiles) * item.intervalMiles;
  const remaining = nextDue - currentMiles;
  const pct = remaining / item.intervalMiles;
  if (pct <= 0) return { label: "OVERDUE", color: "#C44B3F", bg: "#FDF0EE", nextDue, remaining };
  if (pct <= 0.15) return { label: "DUE SOON", color: "#D4932A", bg: "#FDF6E8", nextDue, remaining };
  return { label: "ON TRACK", color: "#2D5A3D", bg: "#E8F0EA", nextDue, remaining };
}

const cache = {};

async function lookupVehicle(yearMakeModel) {
  const prompt = `You are a vehicle maintenance database. Given a vehicle, return its complete manufacturer-recommended maintenance schedule as JSON. Be accurate to the actual manufacturer recommendations.

Vehicle: ${yearMakeModel}

Return ONLY valid JSON with no markdown backticks, no explanation, no preamble. Just the raw JSON object:
{"vehicle":"YEAR MAKE MODEL","engine":"engine description","oil":"oil weight and type","oilCapacity":"quarts","battery":"group size","tireFront":"size","tireRear":"size","schedule":[{"name":"Service name","intervalMiles":7500,"intervalMonths":12,"category":"fluid","amazonQuery":"search query for this part for this vehicle"}]}

category must be: fluid, filter, tire, brake, ignition, belt, wiper, electrical, drivetrain, or other.
intervalMiles or intervalMonths can be null if not applicable.
amazonQuery should be null for service-only items like tire rotation. For parts, make it specific to the vehicle.
Include all standard items: oil+filter, cabin air filter, engine air filter, transmission fluid, coolant, brake fluid, spark plugs, belts, tire rotation, brake pads, wipers, battery, and any vehicle-specific items like differential/transfer case fluid for AWD/4WD.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();

  if (!data.content || data.content.length === 0) {
    throw new Error("Empty API response");
  }

  const text = data.content.map(item => item.type === "text" ? item.text : "").join("").trim();
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(clean);
  } catch (parseErr) {
    throw new Error(`JSON parse failed. Raw response: ${clean.slice(0, 300)}`);
  }
}

const ScheduleItem = ({ item, currentMiles }) => {
  const cat = CATEGORY_META[item.category] || CATEGORY_META.other;
  const status = getMileageStatus(item, currentMiles);
  const [expanded, setExpanded] = useState(false);
  const intervalText = [
    item.intervalMiles ? `Every ${item.intervalMiles.toLocaleString()} mi` : null,
    item.intervalMonths ? `Every ${item.intervalMonths} mo` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div style={{
      background: "#fff", borderRadius: 12, marginBottom: 10,
      border: "1px solid #E8E4DC", overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "16px 20px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{cat.icon}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{item.name}</div>
            <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 3 }}>{intervalText || "See details"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {status && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: status.color, background: status.bg,
              padding: "4px 10px", borderRadius: 20,
            }}>{status.remaining <= 0 ? "OVERDUE" : `${status.remaining.toLocaleString()} mi`}</span>
          )}
          <span style={{ fontSize: 14, color: "#CCC", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F0EDE7", paddingTop: 14 }}>
          {status && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 12px", background: status.bg, borderRadius: 8, marginBottom: 12, color: "#5A5A5A" }}>
              <span>Next due at <strong style={{ color: status.color }}>{status.nextDue.toLocaleString()} mi</strong></span>
              <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>
            </div>
          )}
          {item.amazonQuery ? (
            <a href={amazonLink(item.amazonQuery)} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", background: "#FFF9EE", border: "1px solid #F0E6CC",
              borderRadius: 10, textDecoration: "none", color: "#1A1A1A",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🛒</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.amazonQuery}</div>
                  <div style={{ fontSize: 11, color: "#C4A265", marginTop: 2 }}>Amazon · affiliate link</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#C4A265", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>Shop →</span>
            </a>
          ) : (
            <div style={{ fontSize: 13, color: "#9A9A9A", fontStyle: "italic" }}>Service item — no parts to purchase</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [input, setInput] = useState("");
  const [mileage, setMileage] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const ref = useRef(null);

  const lookup = async (vehicle) => {
    const v = vehicle || input.trim();
    if (!v) return;
    setInput(v);

    if (cache[v.toLowerCase()]) {
      setData(cache[v.toLowerCase()]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setFilterCat("all");

    try {
      setPhase("Decoding vehicle...");
      await new Promise(r => setTimeout(r, 500));
      setPhase("Looking up maintenance schedule...");
      const result = await lookupVehicle(v);
      setPhase("Generating affiliate links...");
      await new Promise(r => setTimeout(r, 300));
      cache[v.toLowerCase()] = result;
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPhase("");
    }
  };

  const reset = () => {
    setInput(""); setMileage(""); setData(null); setError(null); setFilterCat("all");
    setTimeout(() => ref.current?.focus(), 100);
  };

  const miles = parseInt(mileage) || 0;
  const schedule = data?.schedule || [];
  const cats = [...new Set(schedule.map(s => s.category))];
  const filtered = filterCat === "all" ? schedule : schedule.filter(s => s.category === filterCat);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F7F5F0 0%, #EDE9E0 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ background: "#fff", borderBottom: "1px solid #E8E4DC", padding: "16px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#2D5A3D", fontFamily: "Georgia, serif", letterSpacing: 1 }}>LIFEKEEP</span>
            <span style={{ fontSize: 13, color: "#9A9A9A", marginLeft: 10 }}>Vehicle Lookup</span>
          </div>
          {data && <button onClick={reset} style={{ background: "none", border: "1px solid #E0DCD4", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#5A5A5A", cursor: "pointer", fontFamily: "inherit" }}>New Search</button>}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {!data && !loading && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 32, marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", margin: 0, fontFamily: "Georgia, serif" }}>Vehicle Maintenance Lookup</h1>
              <p style={{ fontSize: 15, color: "#9A9A9A", marginTop: 8 }}>Enter any year, make, and model</p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input ref={ref} value={input} onChange={e => setInput(e.target.value)}
                placeholder="e.g. 2019 Subaru Outback"
                style={{ flex: 1, padding: "16px 20px", fontSize: 16, border: "2px solid #E0DCD4", borderRadius: 14, background: "#fff", outline: "none", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "#2D5A3D"}
                onBlur={e => e.target.style.borderColor = "#E0DCD4"}
                onKeyDown={e => { if (e.key === "Enter") lookup(); }}
              />
              <button onClick={() => lookup()} disabled={!input.trim()} style={{
                padding: "16px 24px", borderRadius: 14, border: "none",
                background: input.trim() ? "#2D5A3D" : "#D0CCC4",
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: input.trim() ? "pointer" : "default", fontFamily: "inherit",
              }}>Look Up</button>
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: "14px 20px", background: "#FDF0EE", borderRadius: 12, fontSize: 13, color: "#C44B3F", lineHeight: 1.6, wordBreak: "break-word" }}>
                <strong>Error: </strong>{error}
              </div>
            )}

            <div style={{ marginTop: 20, padding: "14px 20px", background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Quick picks</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["2019 Subaru Outback", "2023 BMW X3", "2022 Kia Telluride", "2018 Toyota Tacoma", "2024 Hyundai Tucson", "2020 Mazda CX-5", "2021 Honda Civic", "2022 Ford Bronco"].map(v => (
                  <button key={v} onClick={() => lookup(v)} style={{
                    background: "#F5F3EF", border: "none", borderRadius: 8, padding: "8px 12px",
                    fontSize: 12, color: "#5A5A5A", cursor: "pointer", fontFamily: "inherit",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#2D5A3D"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#F5F3EF"; e.currentTarget.style.color = "#5A5A5A"; }}
                  >{v}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ width: 48, height: 48, border: "4px solid #E8E4DC", borderTopColor: "#2D5A3D", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>{input}</div>
            <div style={{ fontSize: 13, color: "#5A5A5A", marginTop: 8 }}>{phase}</div>
          </div>
        )}

        {data && !loading && (
          <div>
            {/* Vehicle Card */}
            <div style={{
              background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
              borderRadius: 16, padding: "24px 28px", color: "#fff", position: "relative", overflow: "hidden", marginBottom: 24,
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>Vehicle Profile</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{data.vehicle}</div>
              <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
                {[["Engine", data.engine], ["Oil", data.oil], ["Capacity", data.oilCapacity], ["Tires", data.tireFront], ["Battery", data.battery]].map(([l, v]) =>
                  v && v !== "N/A" ? (
                    <div key={l}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{v}</div>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Mileage */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #E8E4DC", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#9A9A9A", marginBottom: 4 }}>Current Mileage</div>
                <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Enter miles to see what's due"
                  style={{ width: "100%", border: "none", outline: "none", fontSize: 16, fontWeight: 600, color: "#1A1A1A", background: "transparent", fontFamily: "inherit" }}
                />
              </div>
              {miles > 0 && <div style={{ background: "#E8F0EA", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#2D5A3D" }}>{miles.toLocaleString()} mi</div>}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
              <button onClick={() => setFilterCat("all")} style={{
                padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                background: filterCat === "all" ? "#2D5A3D" : "#fff", color: filterCat === "all" ? "#fff" : "#5A5A5A",
              }}>All ({schedule.length})</button>
              {cats.map(c => {
                const m = CATEGORY_META[c] || CATEGORY_META.other;
                return (
                  <button key={c} onClick={() => setFilterCat(c)} style={{
                    padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    background: filterCat === c ? m.color : "#fff", color: filterCat === c ? "#fff" : "#5A5A5A",
                  }}>{m.icon} {c} ({schedule.filter(s => s.category === c).length})</button>
                );
              })}
            </div>

            {/* Schedule */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
              {filtered.length} maintenance items
            </div>
            {filtered.map((item, i) => <ScheduleItem key={i} item={item} currentMiles={miles} />)}

            <div style={{ marginTop: 24, padding: "16px 20px", background: "#E8F0EA", borderRadius: 14, fontSize: 13, color: "#2D5A3D", lineHeight: 1.7 }}>
              <strong>Cached:</strong> Searching "{data.vehicle}" again is instant and free. In production, structured APIs replace this call entirely.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
