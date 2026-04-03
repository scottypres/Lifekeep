import { useState, useEffect } from "react";

const STORAGE_KEY = "lifekeep_llm_keys";

const PROVIDERS = [
  { key: "anthropic", label: "Anthropic", envVar: "ANTHROPIC_API_KEY", placeholder: "sk-ant-..." },
  { key: "openai", label: "OpenAI", envVar: "OPENAI_API_KEY", placeholder: "sk-..." },
  { key: "gemini", label: "Google AI (Gemini)", envVar: "GEMINI_API_KEY", placeholder: "AIza..." },
];

function loadKeys() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveKeys(keys) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(keys)); } catch {}
}

export function getApiKeys() {
  return loadKeys();
}

export default function LLMSettings() {
  const [keys, setKeys] = useState(loadKeys);
  const [visible, setVisible] = useState({});
  const [testing, setTesting] = useState({});
  const [status, setStatus] = useState({});

  useEffect(() => { saveKeys(keys); }, [keys]);

  const updateKey = (provider, value) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
    setStatus(prev => ({ ...prev, [provider]: null }));
  };

  const testKey = async (provider) => {
    const key = keys[provider];
    if (!key) return;
    setTesting(prev => ({ ...prev, [provider]: true }));
    setStatus(prev => ({ ...prev, [provider]: null }));

    try {
      let ok = false;
      if (provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 5, messages: [{ role: "user", content: "Hi" }] }),
        });
        ok = res.ok;
      } else if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 5, messages: [{ role: "user", content: "Hi" }] }),
        });
        ok = res.ok;
      } else if (provider === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }], generationConfig: { maxOutputTokens: 5 } }),
        });
        ok = res.ok;
      }
      setStatus(prev => ({ ...prev, [provider]: ok ? "ok" : "fail" }));
    } catch {
      setStatus(prev => ({ ...prev, [provider]: "fail" }));
    }
    setTesting(prev => ({ ...prev, [provider]: false }));
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #F7F5F0 0%, #EDE9E0 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: 24,
    }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2D5A3D", margin: "0 0 8px" }}>API Key Settings</h2>
        <p style={{ fontSize: 13, color: "#8A8A8A", margin: "0 0 24px", lineHeight: 1.5 }}>
          Enter API keys for each provider. Keys are stored in your browser only and never sent to the server
          except as part of comparison API requests. If left blank, server environment variables are used as fallback.
        </p>

        {PROVIDERS.map(p => (
          <div key={p.key} style={{
            background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12,
            padding: 16, marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{p.label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {status[p.key] === "ok" && <span style={{ color: "#2D5A3D", fontSize: 18 }}>&#10003;</span>}
                {status[p.key] === "fail" && <span style={{ color: "#D44", fontSize: 18 }}>&#10007;</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={visible[p.key] ? "text" : "password"}
                value={keys[p.key] || ""}
                onChange={e => updateKey(p.key, e.target.value)}
                placeholder={p.placeholder}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #E0DCD4",
                  fontSize: 13, fontFamily: "monospace", background: "#FAFAF8",
                }}
              />
              <button
                onClick={() => setVisible(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: "1px solid #E0DCD4",
                  background: "#fff", cursor: "pointer", fontSize: 13, color: "#666",
                }}
              >{visible[p.key] ? "Hide" : "Show"}</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "#AAA" }}>Fallback: {p.envVar}</span>
              <button
                onClick={() => testKey(p.key)}
                disabled={!keys[p.key] || testing[p.key]}
                style={{
                  padding: "4px 12px", borderRadius: 6, border: "1px solid #E0DCD4",
                  background: keys[p.key] ? "#F7F5F0" : "#F0F0F0", cursor: keys[p.key] ? "pointer" : "default",
                  fontSize: 12, color: keys[p.key] ? "#2D5A3D" : "#CCC", fontWeight: 600,
                }}
              >{testing[p.key] ? "Testing..." : "Test Key"}</button>
            </div>
          </div>
        ))}

        <button
          onClick={() => { setKeys({}); setStatus({}); }}
          style={{
            marginTop: 8, padding: "8px 16px", borderRadius: 8, border: "1px solid #E0DCD4",
            background: "#fff", cursor: "pointer", fontSize: 13, color: "#999",
          }}
        >Clear All Keys</button>
      </div>
    </div>
  );
}
