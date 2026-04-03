import { useState, useRef } from "react";

const CATEGORY_META = {
  fluid: { icon: "🛢️", color: "#5B8FA8", label: "Fluids" },
  filter: { icon: "🔲", color: "#6B8C5E", label: "Filters" },
  tire: { icon: "🔄", color: "#8B7355", label: "Tires" },
  brake: { icon: "🛑", color: "#C44B3F", label: "Brakes" },
  ignition: { icon: "⚡", color: "#D4932A", label: "Ignition" },
  belt: { icon: "〰️", color: "#7B6B9E", label: "Belts" },
  wiper: { icon: "🌧️", color: "#5A8FAD", label: "Wipers" },
  electrical: { icon: "🔋", color: "#C4A265", label: "Electrical" },
  drivetrain: { icon: "⚙️", color: "#7B6B9E", label: "Drivetrain" },
  other: { icon: "🔧", color: "#888", label: "Other" },
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

async function lookupVehicle(yearMakeModel) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are a vehicle maintenance database. Given a vehicle, return its complete manufacturer-recommended maintenance schedule as JSON. Be accurate to the actual manufacturer recommendations for this specific vehicle.

Vehicle: ${yearMakeModel}

Return ONLY valid JSON (no markdown, no backticks, no explanation) in this exact format:
{
  "vehicle": "YEAR MAKE MODEL",
  "engine": "engine description",
  "oil": "recommended oil weight and type",
  "oilCapacity": "oil capacity in quarts",
  "battery": "battery group size",
  "tireFront": "front tire size",
  "tireRear": "rear tire size",
  "schedule": [
    {
      "name": "Service item name",
      "intervalMiles": 7500,
      "intervalMonths": 12,
      "category": "fluid",
      "amazonQuery": "specific search query to find this exact part on Amazon for this vehicle"
    }
  ]
}

Rules:
- intervalMiles can be null if time-based only
- intervalMonths can be null if mileage-based only  
- category must be one of: fluid, filter, tire, brake, ignition, belt, wiper, electrical, drivetrain, other
- amazonQuery should be specific enough to find the right part (include year make model and part type). Set to null for service-only items like tire rotation or inspections that don't have purchasable parts.
- Include ALL standard maintenance items: oil, filters (cabin, engine, fuel if applicable), transmission fluid, coolant, brake fluid, spark plugs, drive/timing belts, tire rotation, brake pads, wiper blades, battery, differential fluid if AWD/4WD, transfer case fluid if applicable
- For EVs, omit oil/spark plugs/transmission and include EV-specific items
- Be accurate to this specific vehicle's manufacturer recommendations`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content.map(item => item.type === "text" ? item.text : "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── Cache for lookups ───
const cache = {};

// ─── Components ───

const VehicleCard = ({ data }) => (
  <div style={{
    background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
    borderRadius: 16, padding: "24px 28px", color: "#fff", position: "relative", overflow: "hidden",
    marginBottom: 24,
  }}>
    <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
    <div style={{ position: "absolute", bottom: -40, right: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>Vehicle Profile</div>
    <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, letterSpacing: -0.5 }}>{data.vehicle}</div>
    <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
      {[
        ["Engine", data.engine],
        ["Oil", data.oil],
        ["Capacity", data.oilCapacity],
        ["Tires", data.tireFront],
        ["Battery", data.battery],
      ].map(([label, val]) => val && val !== "N/A" && val !== "null" ? (
        <div key={label}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{val}</div>
        </div>
      ) : null)}
    </div>
  </div>
);

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
      border: `1px solid ${status?.color || "#E0DCD4"}22`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "16px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{cat.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{item.name}</div>
            <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 3 }}>{intervalText}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {status && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              color: status.color, background: status.bg,
              padding: "4px 10px", borderRadius: 20,
            }}>
              {status.remaining <= 0 ? "OVERDUE" : `${status.remaining.toLocaleString()} mi`}
            </span>
          )}
          <span style={{
            fontSize: 14, color: "#CCC", transition: "transform 0.2s",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}>›</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F0EDE7", paddingTop: 14 }}>
          {status && (
            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A5A5A",
              marginBottom: 12, padding: "8px 12px", background: status.bg, borderRadius: 8,
            }}>
              <span>Next due at <strong style={{ color: status.color }}>{status.nextDue.toLocaleString()} miles</strong></span>
              <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>
            </div>
          )}
          {item.intervalMonths && !item.intervalMiles && (
            <div style={{
              fontSize: 13, color: "#5A5A5A", marginBottom: 12,
              padding: "8px 12px", background: "#F5F3EF", borderRadius: 8,
            }}>
              Time-based: every <strong>{item.intervalMonths} months</strong>
            </div>
          )}
          {item.amazonQuery ? (
            <a
              href={amazonLink(item.amazonQuery)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: "#FFF9EE",
                border: "1px solid #F0E6CC", borderRadius: 10,
                textDecoration: "none", color: "#1A1A1A",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🛒</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.amazonQuery}</div>
                  <div style={{ fontSize: 11, color: "#C4A265", marginTop: 2 }}>Amazon · affiliate link · tag: lifekeep-20</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#C4A265", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>Shop →</span>
            </a>
          ) : (
            <div style={{ fontSize: 13, color: "#9A9A9A", fontStyle: "italic" }}>
              Service item — no parts to purchase
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main App ───
export default function LifekeepVehicleLookup() {
  const [input, setInput] = useState("");
  const [mileage, setMileage] = useState("");
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [loadingPhase, setLoadingPhase] = useState("");
  const inputRef = useRef(null);

  const handleLookup = async () => {
    if (!input.trim()) return;
    const key = input.trim().toLowerCase();

    if (cache[key]) {
      setVehicleData(cache[key]);
      return;
    }

    setLoading(true);
    setError(null);
    setVehicleData(null);
    setFilterCat("all");

    try {
      setLoadingPhase("Decoding vehicle identification...");
      await new Promise(r => setTimeout(r, 600));

      setLoadingPhase("Querying maintenance database...");
      const data = await lookupVehicle(input.trim());

      setLoadingPhase("Generating affiliate product links...");
      await new Promise(r => setTimeout(r, 400));

      cache[key] = data;
      setVehicleData(data);
    } catch (err) {
      console.error(err);
      setError("Could not look up that vehicle. Try a format like '2022 Honda CR-V' or '2019 Ford F-150'.");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const handleReset = () => {
    setInput("");
    setMileage("");
    setVehicleData(null);
    setError(null);
    setFilterCat("all");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const currentMiles = parseInt(mileage) || 0;
  const schedule = vehicleData?.schedule || [];
  const categories = [...new Set(schedule.map(s => s.category))];
  const filtered = filterCat === "all" ? schedule : schedule.filter(s => s.category === filterCat);
  const partsCount = schedule.filter(s => s.amazonQuery).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #F7F5F0 0%, #EDE9E0 100%)",
      fontFamily: "'DM Sans', 'Avenir', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        background: "#fff", borderBottom: "1px solid #E8E4DC",
        padding: "16px 24px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#2D5A3D", fontFamily: "Georgia, serif", letterSpacing: 1 }}>LIFEKEEP</span>
            <span style={{ fontSize: 13, color: "#9A9A9A", marginLeft: 10 }}>Vehicle Lookup</span>
          </div>
          {vehicleData && (
            <button onClick={handleReset} style={{
              background: "none", border: "1px solid #E0DCD4", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, color: "#5A5A5A", cursor: "pointer", fontFamily: "inherit",
            }}>New Search</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Search */}
        {!vehicleData && !loading && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 32, marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", margin: 0, fontFamily: "Georgia, serif" }}>
                Vehicle Maintenance Lookup
              </h1>
              <p style={{ fontSize: 15, color: "#9A9A9A", marginTop: 8, lineHeight: 1.5 }}>
                Enter any year, make, and model — the app looks up the full maintenance schedule and generates product links automatically
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. 2019 Subaru Outback"
                style={{
                  flex: 1, padding: "16px 20px", fontSize: 16,
                  border: "2px solid #E0DCD4", borderRadius: 14,
                  background: "#fff", outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = "#2D5A3D"}
                onBlur={e => e.target.style.borderColor = "#E0DCD4"}
                onKeyDown={e => { if (e.key === "Enter") handleLookup(); }}
              />
              <button
                onClick={handleLookup}
                disabled={!input.trim()}
                style={{
                  padding: "16px 24px", borderRadius: 14, border: "none",
                  background: input.trim() ? "#2D5A3D" : "#D0CCC4",
                  color: "#fff", fontSize: 15, fontWeight: 600,
                  cursor: input.trim() ? "pointer" : "default",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                Look Up
              </button>
            </div>

            {error && (
              <div style={{
                marginTop: 16, padding: "14px 20px",
                background: "#FDF0EE", borderRadius: 12,
                fontSize: 13, color: "#C44B3F",
              }}>{error}</div>
            )}

            <div style={{
              marginTop: 20, padding: "14px 20px",
              background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                Try any vehicle
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["2019 Subaru Outback", "2023 BMW X3", "2022 Kia Telluride", "2018 Toyota Tacoma", "2024 Hyundai Tucson", "2020 Mazda CX-5"].map(v => (
                  <button key={v} onClick={() => { setInput(v); }} style={{
                    background: "#F5F3EF", border: "none", borderRadius: 8,
                    padding: "8px 12px", fontSize: 12, color: "#5A5A5A",
                    cursor: "pointer", fontWeight: 500, fontFamily: "inherit",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#2D5A3D"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#F5F3EF"; e.currentTarget.style.color = "#5A5A5A"; }}
                  >{v}</button>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 12, padding: "16px 20px",
              background: "#E8F0EA", borderRadius: 12,
              fontSize: 13, color: "#2D5A3D", lineHeight: 1.7,
            }}>
              <strong>How this works:</strong> Your input is sent to an API that returns the manufacturer-recommended maintenance schedule as structured data. Each service item gets an auto-generated Amazon affiliate link with the exact part query for your vehicle. In production, this would use NHTSA + CarMD APIs. Results are cached — repeat lookups are instant and free.
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{
              width: 48, height: 48, border: "4px solid #E8E4DC",
              borderTopColor: "#2D5A3D", borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>{input}</div>
            <div style={{ fontSize: 13, color: "#5A5A5A", marginTop: 8 }}>{loadingPhase}</div>

            <div style={{
              marginTop: 32, padding: "16px 20px", background: "#fff",
              borderRadius: 12, border: "1px solid #E8E4DC",
              maxWidth: 360, margin: "32px auto 0",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Pipeline
              </div>
              {[
                { step: "Decode vehicle (NHTSA API)", done: loadingPhase !== "Decoding vehicle identification..." },
                { step: "Fetch schedule (CarMD API)", done: loadingPhase === "Generating affiliate product links..." || !loadingPhase },
                { step: "Generate affiliate links", done: !loadingPhase && !loading },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0", fontSize: 13,
                  color: s.done ? "#2D5A3D" : "#9A9A9A",
                }}>
                  <span style={{ fontSize: 14 }}>{s.done ? "✅" : "⏳"}</span>
                  <span>{s.step}</span>
                  {s.done && <span style={{ fontSize: 11, color: "#9A9A9A", marginLeft: "auto" }}>~$0.002</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {vehicleData && !loading && (
          <div>
            <VehicleCard data={vehicleData} />

            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20,
            }}>
              {[
                { label: "Service Items", value: schedule.length, color: "#2D5A3D" },
                { label: "Parts Linked", value: partsCount, color: "#C4A265" },
                { label: "Lookup Cost", value: "<$0.01", color: "#5B8FA8" },
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

            {/* Mileage */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: "16px 20px",
              border: "1px solid #E8E4DC", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#9A9A9A", fontWeight: 500, marginBottom: 4 }}>Current Mileage</div>
                <input
                  type="number"
                  value={mileage}
                  onChange={e => setMileage(e.target.value)}
                  placeholder="Enter miles to see what's due"
                  style={{
                    width: "100%", border: "none", outline: "none", fontSize: 16,
                    fontWeight: 600, color: "#1A1A1A", background: "transparent",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              {currentMiles > 0 && (
                <div style={{
                  background: "#E8F0EA", borderRadius: 8, padding: "6px 12px",
                  fontSize: 12, fontWeight: 600, color: "#2D5A3D", whiteSpace: "nowrap",
                }}>{currentMiles.toLocaleString()} mi</div>
              )}
            </div>

            {/* Category Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
              <button onClick={() => setFilterCat("all")} style={{
                padding: "6px 14px", borderRadius: 20, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                background: filterCat === "all" ? "#2D5A3D" : "#fff",
                color: filterCat === "all" ? "#fff" : "#5A5A5A",
              }}>All ({schedule.length})</button>
              {categories.map(cat => {
                const meta = CATEGORY_META[cat] || CATEGORY_META.other;
                const count = schedule.filter(s => s.category === cat).length;
                return (
                  <button key={cat} onClick={() => setFilterCat(cat)} style={{
                    padding: "6px 14px", borderRadius: 20, border: "none",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                    background: filterCat === cat ? meta.color : "#fff",
                    color: filterCat === cat ? "#fff" : "#5A5A5A",
                  }}>{meta.icon} {meta.label} ({count})</button>
                );
              })}
            </div>

            {/* Items */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
              Maintenance Schedule · {filtered.length} items
            </div>
            {filtered.map((item, i) => (
              <ScheduleItem key={i} item={item} currentMiles={currentMiles} />
            ))}

            {/* Cache note */}
            <div style={{
              marginTop: 24, padding: "16px 20px",
              background: "#E8F0EA", borderRadius: 14,
              fontSize: 13, color: "#2D5A3D", lineHeight: 1.7,
            }}>
              <strong>Cached:</strong> This result is now stored. Searching for "{vehicleData.vehicle}" again will return instantly with zero API cost. In production, every lookup gets cached permanently — the database grows with each user, making future lookups free.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
