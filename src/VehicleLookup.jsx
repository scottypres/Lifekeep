import { useState, useEffect, useRef } from "react";

// ─── Vehicle Database (in production this would be API calls to NHTSA + CarMD) ───
const VEHICLES = {
  "2022 Honda CR-V": {
    engine: "1.5L Turbo I4", oil: "0W-20 Full Synthetic", oilCapacity: "3.7 qt",
    battery: "Group 51R", tireFront: "235/65R17", tireRear: "235/65R17",
    schedule: [
      { name: "Engine Oil & Filter", intervalMiles: 7500, intervalMonths: 12, category: "fluid", part: "0W-20 synthetic oil Honda CR-V", filter: "oil filter Honda CR-V 2022" },
      { name: "Tire Rotation", intervalMiles: 7500, intervalMonths: 12, category: "tire", part: null, filter: null },
      { name: "Cabin Air Filter", intervalMiles: 15000, intervalMonths: 18, category: "filter", part: "cabin air filter 2022 Honda CR-V", filter: null },
      { name: "Engine Air Filter", intervalMiles: 30000, intervalMonths: 36, category: "filter", part: "engine air filter 2022 Honda CR-V", filter: null },
      { name: "Brake Fluid", intervalMiles: null, intervalMonths: 36, category: "fluid", part: "DOT 3 brake fluid Honda", filter: null },
      { name: "Transmission Fluid", intervalMiles: 60000, intervalMonths: null, category: "fluid", part: "CVT transmission fluid Honda CR-V", filter: null },
      { name: "Spark Plugs", intervalMiles: 60000, intervalMonths: null, category: "ignition", part: "spark plugs 2022 Honda CR-V 1.5T", filter: null },
      { name: "Coolant", intervalMiles: 120000, intervalMonths: 120, category: "fluid", part: "Honda Type 2 coolant", filter: null },
      { name: "Drive Belt", intervalMiles: 90000, intervalMonths: null, category: "belt", part: "serpentine belt 2022 Honda CR-V", filter: null },
      { name: "Brake Pads (inspect)", intervalMiles: 15000, intervalMonths: 18, category: "brake", part: "front brake pads 2022 Honda CR-V", filter: null },
      { name: "Wiper Blades", intervalMiles: null, intervalMonths: 12, category: "wiper", part: "wiper blades 2022 Honda CR-V", filter: null },
      { name: "Battery (inspect)", intervalMiles: null, intervalMonths: 36, category: "electrical", part: "Group 51R battery Honda CR-V", filter: null },
    ]
  },
  "2023 Toyota Camry": {
    engine: "2.5L I4", oil: "0W-20 Full Synthetic", oilCapacity: "4.8 qt",
    battery: "Group 35", tireFront: "235/45R18", tireRear: "235/45R18",
    schedule: [
      { name: "Engine Oil & Filter", intervalMiles: 10000, intervalMonths: 12, category: "fluid", part: "0W-20 synthetic oil Toyota Camry", filter: "oil filter 2023 Toyota Camry" },
      { name: "Tire Rotation", intervalMiles: 5000, intervalMonths: 6, category: "tire", part: null, filter: null },
      { name: "Cabin Air Filter", intervalMiles: 20000, intervalMonths: 24, category: "filter", part: "cabin air filter 2023 Toyota Camry", filter: null },
      { name: "Engine Air Filter", intervalMiles: 30000, intervalMonths: 36, category: "filter", part: "engine air filter 2023 Toyota Camry", filter: null },
      { name: "Brake Fluid", intervalMiles: null, intervalMonths: 24, category: "fluid", part: "DOT 3 brake fluid Toyota", filter: null },
      { name: "Transmission Fluid", intervalMiles: 60000, intervalMonths: null, category: "fluid", part: "ATF WS transmission fluid Toyota", filter: null },
      { name: "Spark Plugs", intervalMiles: 60000, intervalMonths: null, category: "ignition", part: "spark plugs 2023 Toyota Camry 2.5L", filter: null },
      { name: "Coolant", intervalMiles: 100000, intervalMonths: 120, category: "fluid", part: "Toyota Super Long Life coolant", filter: null },
      { name: "Drive Belt", intervalMiles: 75000, intervalMonths: null, category: "belt", part: "serpentine belt 2023 Toyota Camry", filter: null },
      { name: "Brake Pads (inspect)", intervalMiles: 15000, intervalMonths: 18, category: "brake", part: "front brake pads 2023 Toyota Camry", filter: null },
      { name: "Wiper Blades", intervalMiles: null, intervalMonths: 12, category: "wiper", part: "wiper blades 2023 Toyota Camry", filter: null },
      { name: "Battery (inspect)", intervalMiles: null, intervalMonths: 36, category: "electrical", part: "Group 35 battery Toyota Camry", filter: null },
    ]
  },
  "2021 Ford F-150": {
    engine: "3.5L EcoBoost V6", oil: "5W-30 Full Synthetic", oilCapacity: "6.0 qt",
    battery: "Group 65", tireFront: "275/65R18", tireRear: "275/65R18",
    schedule: [
      { name: "Engine Oil & Filter", intervalMiles: 10000, intervalMonths: 12, category: "fluid", part: "5W-30 synthetic oil Ford F-150 EcoBoost", filter: "oil filter 2021 Ford F-150 3.5 EcoBoost" },
      { name: "Tire Rotation", intervalMiles: 10000, intervalMonths: 12, category: "tire", part: null, filter: null },
      { name: "Cabin Air Filter", intervalMiles: 20000, intervalMonths: 24, category: "filter", part: "cabin air filter 2021 Ford F-150", filter: null },
      { name: "Engine Air Filter", intervalMiles: 30000, intervalMonths: 36, category: "filter", part: "engine air filter 2021 Ford F-150 3.5 EcoBoost", filter: null },
      { name: "Brake Fluid", intervalMiles: null, intervalMonths: 36, category: "fluid", part: "DOT 4 brake fluid Ford", filter: null },
      { name: "Transmission Fluid", intervalMiles: 150000, intervalMonths: null, category: "fluid", part: "Mercon ULV transmission fluid Ford", filter: null },
      { name: "Spark Plugs", intervalMiles: 60000, intervalMonths: null, category: "ignition", part: "spark plugs 2021 Ford F-150 3.5 EcoBoost", filter: null },
      { name: "Coolant", intervalMiles: 100000, intervalMonths: 72, category: "fluid", part: "Motorcraft orange coolant Ford", filter: null },
      { name: "Drive Belt", intervalMiles: 100000, intervalMonths: null, category: "belt", part: "serpentine belt 2021 Ford F-150 3.5", filter: null },
      { name: "Brake Pads (inspect)", intervalMiles: 20000, intervalMonths: 24, category: "brake", part: "front brake pads 2021 Ford F-150", filter: null },
      { name: "Wiper Blades", intervalMiles: null, intervalMonths: 12, category: "wiper", part: "wiper blades 2021 Ford F-150", filter: null },
      { name: "Transfer Case Fluid", intervalMiles: 150000, intervalMonths: null, category: "fluid", part: "transfer case fluid Ford F-150 4WD", filter: null },
      { name: "Battery (inspect)", intervalMiles: null, intervalMonths: 48, category: "electrical", part: "Group 65 battery Ford F-150", filter: null },
    ]
  },
  "2024 Tesla Model 3": {
    engine: "Electric Motor", oil: "N/A", oilCapacity: "N/A",
    battery: "High Voltage Li-ion", tireFront: "235/45R18", tireRear: "235/45R18",
    schedule: [
      { name: "Tire Rotation", intervalMiles: 6250, intervalMonths: 6, category: "tire", part: null, filter: null },
      { name: "Cabin Air Filter (HEPA)", intervalMiles: null, intervalMonths: 24, category: "filter", part: "HEPA cabin air filter Tesla Model 3", filter: null },
      { name: "Brake Fluid Test", intervalMiles: null, intervalMonths: 24, category: "fluid", part: "DOT 3 brake fluid Tesla", filter: null },
      { name: "A/C Desiccant Bag", intervalMiles: null, intervalMonths: 72, category: "filter", part: "AC desiccant bag Tesla Model 3", filter: null },
      { name: "Brake Pads (inspect)", intervalMiles: null, intervalMonths: 24, category: "brake", part: "brake pads Tesla Model 3", filter: null },
      { name: "Wiper Blades", intervalMiles: null, intervalMonths: 12, category: "wiper", part: "wiper blades Tesla Model 3", filter: null },
      { name: "Tire Alignment Check", intervalMiles: 12000, intervalMonths: 12, category: "tire", part: null, filter: null },
    ]
  },
  "2020 Chevrolet Silverado 1500": {
    engine: "5.3L V8", oil: "0W-20 Full Synthetic", oilCapacity: "8.0 qt",
    battery: "Group 48", tireFront: "275/60R20", tireRear: "275/60R20",
    schedule: [
      { name: "Engine Oil & Filter", intervalMiles: 7500, intervalMonths: 12, category: "fluid", part: "0W-20 synthetic oil Chevy Silverado 5.3", filter: "oil filter 2020 Chevy Silverado 5.3L" },
      { name: "Tire Rotation", intervalMiles: 7500, intervalMonths: 12, category: "tire", part: null, filter: null },
      { name: "Cabin Air Filter", intervalMiles: 22500, intervalMonths: 24, category: "filter", part: "cabin air filter 2020 Chevy Silverado", filter: null },
      { name: "Engine Air Filter", intervalMiles: 45000, intervalMonths: 48, category: "filter", part: "engine air filter 2020 Chevy Silverado 5.3", filter: null },
      { name: "Brake Fluid", intervalMiles: null, intervalMonths: 36, category: "fluid", part: "DOT 4 brake fluid GM", filter: null },
      { name: "Transmission Fluid", intervalMiles: 45000, intervalMonths: null, category: "fluid", part: "Dexron VI transmission fluid Chevy Silverado", filter: null },
      { name: "Spark Plugs", intervalMiles: 97500, intervalMonths: null, category: "ignition", part: "spark plugs 2020 Chevy Silverado 5.3L V8", filter: null },
      { name: "Coolant", intervalMiles: 150000, intervalMonths: 60, category: "fluid", part: "Dex-Cool coolant GM Chevrolet", filter: null },
      { name: "Drive Belt", intervalMiles: 90000, intervalMonths: null, category: "belt", part: "serpentine belt 2020 Chevy Silverado 5.3", filter: null },
      { name: "Brake Pads (inspect)", intervalMiles: 15000, intervalMonths: 18, category: "brake", part: "front brake pads 2020 Chevy Silverado 1500", filter: null },
      { name: "Wiper Blades", intervalMiles: null, intervalMonths: 12, category: "wiper", part: "wiper blades 2020 Chevy Silverado", filter: null },
      { name: "Differential Fluid", intervalMiles: 45000, intervalMonths: null, category: "fluid", part: "differential fluid Chevy Silverado", filter: null },
      { name: "Battery (inspect)", intervalMiles: null, intervalMonths: 48, category: "electrical", part: "Group 48 battery Chevy Silverado", filter: null },
    ]
  },
  "2023 Jeep Wrangler": {
    engine: "3.6L Pentastar V6", oil: "0W-20 Full Synthetic", oilCapacity: "5.0 qt",
    battery: "Group H7", tireFront: "255/70R18", tireRear: "255/70R18",
    schedule: [
      { name: "Engine Oil & Filter", intervalMiles: 10000, intervalMonths: 12, category: "fluid", part: "0W-20 synthetic oil Jeep Wrangler 3.6", filter: "oil filter 2023 Jeep Wrangler 3.6L" },
      { name: "Tire Rotation", intervalMiles: 7500, intervalMonths: 6, category: "tire", part: null, filter: null },
      { name: "Cabin Air Filter", intervalMiles: 20000, intervalMonths: 24, category: "filter", part: "cabin air filter 2023 Jeep Wrangler", filter: null },
      { name: "Engine Air Filter", intervalMiles: 30000, intervalMonths: 36, category: "filter", part: "engine air filter 2023 Jeep Wrangler 3.6L", filter: null },
      { name: "Brake Fluid", intervalMiles: null, intervalMonths: 36, category: "fluid", part: "DOT 4 brake fluid Jeep", filter: null },
      { name: "Transmission Fluid", intervalMiles: 60000, intervalMonths: null, category: "fluid", part: "ATF+4 transmission fluid Jeep Wrangler", filter: null },
      { name: "Spark Plugs", intervalMiles: 100000, intervalMonths: null, category: "ignition", part: "spark plugs 2023 Jeep Wrangler 3.6L V6", filter: null },
      { name: "Coolant", intervalMiles: 100000, intervalMonths: 120, category: "fluid", part: "OAT coolant Jeep Wrangler", filter: null },
      { name: "Drive Belt", intervalMiles: 100000, intervalMonths: null, category: "belt", part: "serpentine belt 2023 Jeep Wrangler 3.6", filter: null },
      { name: "Transfer Case Fluid", intervalMiles: 60000, intervalMonths: null, category: "fluid", part: "transfer case fluid Jeep Wrangler", filter: null },
      { name: "Differential Fluid (front & rear)", intervalMiles: 60000, intervalMonths: null, category: "fluid", part: "differential fluid Jeep Wrangler", filter: null },
      { name: "Brake Pads (inspect)", intervalMiles: 20000, intervalMonths: 24, category: "brake", part: "front brake pads 2023 Jeep Wrangler", filter: null },
      { name: "Wiper Blades", intervalMiles: null, intervalMonths: 12, category: "wiper", part: "wiper blades 2023 Jeep Wrangler", filter: null },
      { name: "Battery (inspect)", intervalMiles: null, intervalMonths: 48, category: "electrical", part: "Group H7 battery Jeep Wrangler", filter: null },
    ]
  },
};

const CATEGORY_META = {
  fluid: { icon: "🛢️", color: "#5B8FA8", label: "Fluids" },
  filter: { icon: "🔲", color: "#6B8C5E", label: "Filters" },
  tire: { icon: "🔄", color: "#8B7355", label: "Tires" },
  brake: { icon: "🛑", color: "#C44B3F", label: "Brakes" },
  ignition: { icon: "⚡", color: "#D4932A", label: "Ignition" },
  belt: { icon: "〰️", color: "#7B6B9E", label: "Belts" },
  wiper: { icon: "🌧️", color: "#5A8FAD", label: "Wipers" },
  electrical: { icon: "🔋", color: "#C4A265", label: "Electrical" },
};

function amazonLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lifekeep-20`;
}

function getMileageStatus(item, currentMiles) {
  if (!item.intervalMiles) return null;
  const nextDue = Math.ceil(currentMiles / item.intervalMiles) * item.intervalMiles;
  const remaining = nextDue - currentMiles;
  const pct = remaining / item.intervalMiles;
  if (pct <= 0) return { label: "OVERDUE", color: "#C44B3F", bg: "#FDF0EE", nextDue, remaining };
  if (pct <= 0.15) return { label: "DUE SOON", color: "#D4932A", bg: "#FDF6E8", nextDue, remaining };
  return { label: "ON TRACK", color: "#2D5A3D", bg: "#E8F0EA", nextDue, remaining };
}

// ─── Components ───

const VehicleCard = ({ vehicle, data }) => (
  <div style={{
    background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
    borderRadius: 16, padding: "24px 28px", color: "#fff", position: "relative", overflow: "hidden",
    marginBottom: 24,
  }}>
    <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
    <div style={{ position: "absolute", bottom: -40, right: 60, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>Vehicle Profile</div>
    <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, letterSpacing: -0.5 }}>{vehicle}</div>
    <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
      {[
        ["Engine", data.engine],
        ["Oil", data.oil],
        ["Capacity", data.oilCapacity],
        ["Tires", data.tireFront],
        ["Battery", data.battery],
      ].map(([label, val]) => val && val !== "N/A" ? (
        <div key={label}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{val}</div>
        </div>
      ) : null)}
    </div>
  </div>
);

const ScheduleItem = ({ item, currentMiles }) => {
  const cat = CATEGORY_META[item.category] || { icon: "🔧", color: "#666", label: "Other" };
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
      overflow: "hidden", transition: "all 0.2s",
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
        <div style={{
          padding: "0 20px 16px", borderTop: "1px solid #F0EDE7",
          paddingTop: 14,
        }}>
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
              Time-based interval: every <strong>{item.intervalMonths} months</strong>
            </div>
          )}

          {(item.part || item.filter) && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                Shop Compatible Parts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {item.part && (
                  <a
                    href={amazonLink(item.part)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", background: "#FFF9EE",
                      border: "1px solid #F0E6CC", borderRadius: 10,
                      textDecoration: "none", color: "#1A1A1A",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF3DC"}
                    onMouseLeave={e => e.currentTarget.style.background = "#FFF9EE"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🛒</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.part.split(" ").slice(0, 5).join(" ")}</div>
                        <div style={{ fontSize: 11, color: "#C4A265", marginTop: 1 }}>Amazon · affiliate link</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: "#C4A265", fontWeight: 600 }}>View →</span>
                  </a>
                )}
                {item.filter && (
                  <a
                    href={amazonLink(item.filter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", background: "#FFF9EE",
                      border: "1px solid #F0E6CC", borderRadius: 10,
                      textDecoration: "none", color: "#1A1A1A",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF3DC"}
                    onMouseLeave={e => e.currentTarget.style.background = "#FFF9EE"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🛒</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.filter.split(" ").slice(0, 5).join(" ")}</div>
                        <div style={{ fontSize: 11, color: "#C4A265", marginTop: 1 }}>Amazon · affiliate link</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: "#C4A265", fontWeight: 600 }}>View →</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {!item.part && !item.filter && (
            <div style={{ fontSize: 13, color: "#9A9A9A", fontStyle: "italic" }}>
              Service item — no parts to purchase (performed by shop or DIY inspection)
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
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [filterCat, setFilterCat] = useState("all");
  const inputRef = useRef(null);

  const vehicleNames = Object.keys(VEHICLES);

  useEffect(() => {
    if (input.length >= 2) {
      const q = input.toLowerCase();
      setSuggestions(vehicleNames.filter(v => v.toLowerCase().includes(q)));
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const handleLookup = (vehicleName) => {
    setSearching(true);
    setInput(vehicleName);
    setSuggestions([]);

    // Simulate API call delay
    setTimeout(() => {
      setSelectedVehicle(vehicleName);
      setVehicleData(VEHICLES[vehicleName]);
      setSearching(false);
      setShowResults(true);
    }, 800);
  };

  const handleReset = () => {
    setInput("");
    setMileage("");
    setSelectedVehicle(null);
    setVehicleData(null);
    setShowResults(false);
    setFilterCat("all");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const currentMiles = parseInt(mileage) || 0;
  const categories = vehicleData ? [...new Set(vehicleData.schedule.map(s => s.category))] : [];
  const filteredSchedule = vehicleData?.schedule.filter(s => filterCat === "all" || s.category === filterCat) || [];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #F7F5F0 0%, #EDE9E0 100%)",
      fontFamily: "'DM Sans', 'Avenir', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E8E4DC",
        padding: "16px 24px",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#2D5A3D", fontFamily: "Georgia, serif", letterSpacing: 1 }}>LIFEKEEP</span>
            <span style={{ fontSize: 13, color: "#9A9A9A", marginLeft: 10 }}>Vehicle Lookup</span>
          </div>
          {showResults && (
            <button onClick={handleReset} style={{
              background: "none", border: "1px solid #E0DCD4", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, color: "#5A5A5A", cursor: "pointer",
            }}>New Search</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Search */}
        {!showResults && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 32, marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", margin: 0, fontFamily: "Georgia, serif" }}>
                Vehicle Maintenance Lookup
              </h1>
              <p style={{ fontSize: 15, color: "#9A9A9A", marginTop: 8, lineHeight: 1.5 }}>
                Type your year, make, and model to get a complete maintenance schedule with parts links
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. 2022 Honda CR-V"
                style={{
                  width: "100%", padding: "16px 20px", fontSize: 16,
                  border: "2px solid #E0DCD4", borderRadius: 14,
                  background: "#fff", outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                  fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = "#2D5A3D"}
                onBlur={e => e.target.style.borderColor = "#E0DCD4"}
                onKeyDown={e => {
                  if (e.key === "Enter" && suggestions.length > 0) handleLookup(suggestions[0]);
                }}
              />

              {suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                  background: "#fff", border: "1px solid #E0DCD4",
                  borderRadius: 12, marginTop: 6, overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}>
                  {suggestions.map(v => (
                    <div
                      key={v}
                      onClick={() => handleLookup(v)}
                      style={{
                        padding: "14px 20px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 12,
                        borderBottom: "1px solid #F5F3EF",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9F8F5"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      <span style={{ fontSize: 18 }}>🚗</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{v}</div>
                        <div style={{ fontSize: 12, color: "#9A9A9A" }}>{VEHICLES[v].engine}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              marginTop: 24, padding: "16px 20px",
              background: "#fff", borderRadius: 12, border: "1px solid #E8E4DC",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                Demo vehicles in database
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {vehicleNames.map(v => (
                  <button key={v} onClick={() => handleLookup(v)} style={{
                    background: "#F5F3EF", border: "none", borderRadius: 8,
                    padding: "8px 12px", fontSize: 12, color: "#5A5A5A",
                    cursor: "pointer", fontWeight: 500, fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#2D5A3D"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#F5F3EF"; e.currentTarget.style.color = "#5A5A5A"; }}
                  >{v}</button>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 16, padding: "14px 20px",
              background: "#E8F0EA", borderRadius: 12,
              fontSize: 13, color: "#2D5A3D", lineHeight: 1.6,
            }}>
              💡 In production, this queries the NHTSA VIN decoder API and CarMD maintenance database. This demo uses a built-in dataset for six popular vehicles.
            </div>
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{
              width: 48, height: 48, border: "4px solid #E8E4DC",
              borderTopColor: "#2D5A3D", borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ fontSize: 15, color: "#5A5A5A" }}>Looking up maintenance schedule...</div>
            <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 4 }}>Querying NHTSA + CarMD APIs</div>
          </div>
        )}

        {/* Results */}
        {showResults && vehicleData && (
          <div>
            <VehicleCard vehicle={selectedVehicle} data={vehicleData} />

            {/* Mileage Input */}
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
                  placeholder="Enter your current miles"
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
                }}>
                  {currentMiles.toLocaleString()} mi
                </div>
              )}
            </div>

            {/* Category Filters */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 16, overflowX: "auto",
              paddingBottom: 4,
            }}>
              <button onClick={() => setFilterCat("all")} style={{
                padding: "6px 14px", borderRadius: 20, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "inherit",
                background: filterCat === "all" ? "#2D5A3D" : "#fff",
                color: filterCat === "all" ? "#fff" : "#5A5A5A",
              }}>All ({vehicleData.schedule.length})</button>
              {categories.map(cat => {
                const meta = CATEGORY_META[cat];
                const count = vehicleData.schedule.filter(s => s.category === cat).length;
                return (
                  <button key={cat} onClick={() => setFilterCat(cat)} style={{
                    padding: "6px 14px", borderRadius: 20, border: "none",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                    fontFamily: "inherit",
                    background: filterCat === cat ? meta.color : "#fff",
                    color: filterCat === cat ? "#fff" : "#5A5A5A",
                  }}>{meta.icon} {meta.label} ({count})</button>
                );
              })}
            </div>

            {/* Schedule Items */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
              Maintenance Schedule · {filteredSchedule.length} items
            </div>
            {filteredSchedule.map((item, i) => (
              <ScheduleItem key={i} item={item} currentMiles={currentMiles} />
            ))}

            {/* Summary */}
            <div style={{
              marginTop: 24, padding: "20px",
              background: "#FBF6ED", borderRadius: 14, border: "1px solid #C4A26533",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>🔗</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>How Affiliate Links Work</div>
              </div>
              <div style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.7 }}>
                Each part link is auto-generated by querying Amazon's Product Advertising API with the exact part specifications for your vehicle. The affiliate tag (<code style={{ background: "#F0EDE7", padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>lifekeep-20</code>) is embedded automatically — no manual link creation needed. In production, links would also query Home Depot, AutoZone, and Walmart APIs to show the best price across retailers.
              </div>
            </div>

            <div style={{
              marginTop: 12, padding: "20px",
              background: "#E8F0EA", borderRadius: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2D5A3D" }}>Zero AI Cost for This Lookup</div>
              </div>
              <div style={{ fontSize: 13, color: "#2D5A3D", lineHeight: 1.7 }}>
                This entire schedule was generated with deterministic API calls — no LLM involved. NHTSA decoded the vehicle, CarMD provided the schedule, and Amazon's API generated the affiliate links. Total cost per lookup: under $0.01.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
