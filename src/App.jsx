import { useState } from "react";
import LifekeepPrototype from "./LifekeepPrototype";
import VehicleLookup from "./VehicleLookup";
import HVACScanner from "./HVACScanner";

export default function App() {
  const [view, setView] = useState("home");

  if (view === "prototype") return (
    <div>
      <button onClick={() => setView("home")} style={{
        position: "fixed", top: 16, left: 16, zIndex: 9999,
        background: "#2D5A3D", color: "#fff", border: "none", borderRadius: 10,
        padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>← Back</button>
      <LifekeepPrototype />
    </div>
  );

  if (view === "vehicle") return (
    <div>
      <button onClick={() => setView("home")} style={{
        position: "fixed", top: 16, left: 16, zIndex: 9999,
        background: "#2D5A3D", color: "#fff", border: "none", borderRadius: 10,
        padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>← Back</button>
      <VehicleLookup />
    </div>
  );

  if (view === "hvac") return (
    <div>
      <button onClick={() => setView("home")} style={{
        position: "fixed", top: 16, left: 16, zIndex: 9999,
        background: "#2D5A3D", color: "#fff", border: "none", borderRadius: 10,
        padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>← Back</button>
      <HVACScanner />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #E8E4DC 0%, #D5CFC3 100%)",
      fontFamily: "'DM Sans', 'Avenir', -apple-system, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Georgia&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 48, fontWeight: 700, color: "#2D5A3D",
            fontFamily: "Georgia, serif", letterSpacing: 4, margin: 0,
          }}>LIFEKEEP</h1>
          <div style={{
            width: 60, height: 2, background: "#C4A265",
            margin: "16px auto",
          }} />
          <p style={{
            fontSize: 18, color: "#5A5A5A", fontStyle: "italic",
            fontFamily: "Georgia, serif", margin: 0,
          }}>Your Life, Maintained</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => setView("prototype")} style={{
            background: "#2D5A3D", color: "#fff", border: "none",
            borderRadius: 16, padding: "22px 28px", cursor: "pointer",
            textAlign: "left", transition: "transform 0.15s",
            boxShadow: "0 4px 16px rgba(45,90,61,0.3)",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📱</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>App Prototype</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, lineHeight: 1.5 }}>
              Interactive mockup — onboarding, dashboard, maintenance tracking, weekly digest, and smart capture
            </div>
          </button>

          <button onClick={() => setView("vehicle")} style={{
            background: "#fff", color: "#1A1A1A", border: "2px solid #E0DCD4",
            borderRadius: 16, padding: "22px 28px", cursor: "pointer",
            textAlign: "left", transition: "transform 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚗</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2D5A3D" }}>Vehicle Maintenance Lookup</div>
            <div style={{ fontSize: 13, color: "#5A5A5A", marginTop: 4, lineHeight: 1.5 }}>
              Enter any year/make/model — get the full maintenance schedule with Amazon affiliate links
            </div>
          </button>

          <button onClick={() => setView("hvac")} style={{
            background: "#fff", color: "#1A1A1A", border: "2px solid #E0DCD4",
            borderRadius: 16, padding: "22px 28px", cursor: "pointer",
            textAlign: "left", transition: "transform 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2D5A3D" }}>HVAC Label Scanner</div>
            <div style={{ fontSize: 13, color: "#5A5A5A", marginTop: 4, lineHeight: 1.5 }}>
              Photograph your HVAC label — AI reads it and links you to the exact replacement filter
            </div>
          </button>
        </div>

        <p style={{
          fontSize: 12, color: "#9A9A9A", marginTop: 32,
          lineHeight: 1.6,
        }}>
          Concept prototypes — not a production app.<br />
          View the business proposal and source code on{" "}
          <a href="https://github.com/scottypres/Lifekeep" target="_blank" rel="noopener noreferrer"
            style={{ color: "#2D5A3D", fontWeight: 600 }}>GitHub</a>.
        </p>
      </div>
    </div>
  );
}
