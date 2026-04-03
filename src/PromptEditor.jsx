import { useState, useEffect } from "react";

export default function PromptEditor() {
  const [data, setData] = useState({ activeVersion: null, versions: [] });
  const [editContent, setEditContent] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/prompt");
      const result = await resp.json();
      setData(result);
      const active = result.versions.find(v => v.version === result.activeVersion);
      if (active) {
        setEditContent(active.content);
        setSelectedVersion(active.version);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load prompts" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleSaveNewVersion = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const resp = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, notes: notes || "Manual edit", source: "manual" }),
      });
      const result = await resp.json();
      if (result.success) {
        setMessage({ type: "success", text: `Saved as version ${result.version}` });
        setNotes("");
        await fetchPrompts();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    }
    setSaving(false);
  };

  const handleRestore = async (version) => {
    setRestoring(version);
    try {
      const resp = await fetch("/api/prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeVersion: version }),
      });
      const result = await resp.json();
      if (result.success) {
        setMessage({ type: "success", text: `Version ${version} is now active` });
        await fetchPrompts();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to restore" });
    }
    setRestoring(null);
  };

  const handleSelectVersion = (v) => {
    setSelectedVersion(v.version);
    setEditContent(v.content);
  };

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #E8E4DC 0%, #D5CFC3 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 16, color: "#5A5A5A" }}>Loading prompts...</div>
      </div>
    );
  }

  const activePrompt = data.versions.find(v => v.version === data.activeVersion);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #E8E4DC 0%, #D5CFC3 100%)",
      fontFamily: "'DM Sans', 'Avenir', -apple-system, sans-serif",
      padding: "70px 20px 40px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2D5A3D", margin: "0 0 6px", fontFamily: "Georgia, serif" }}>
            Prompt Editor
          </h2>
          <p style={{ fontSize: 13, color: "#9A9A9A", margin: 0 }}>
            Edit the system prompt used by the AI scanner. Changes take effect on the next scan.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600,
            background: message.type === "success" ? "#E8F0EA" : "#FDF0EE",
            color: message.type === "success" ? "#2D5A3D" : "#C44B3F",
            border: `1px solid ${message.type === "success" ? "#2D5A3D33" : "#C44B3F33"}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Active version indicator */}
        {activePrompt && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
            padding: "10px 14px", background: "#E8F0EA", borderRadius: 10,
            border: "1px solid #2D5A3D33",
          }}>
            <span style={{ fontSize: 14 }}>&#9679;</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#2D5A3D" }}>
              Active: Version {activePrompt.version}
            </span>
            <span style={{ fontSize: 12, color: "#5A5A5A" }}>
              — {activePrompt.notes || "No notes"} ({activePrompt.source})
            </span>
          </div>
        )}

        {!activePrompt && (
          <div style={{
            padding: "10px 14px", background: "#FDF6E8", borderRadius: 10,
            border: "1px solid #D4932A33", marginBottom: 16,
            fontSize: 13, color: "#D4932A", fontWeight: 600,
          }}>
            No saved prompt — using default. Edit below and save to create your first version.
          </div>
        )}

        {/* Editor */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: 20,
          border: "1px solid #E8E4DC", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
              {selectedVersion === data.activeVersion ? "Active Prompt" : `Viewing Version ${selectedVersion || "default"}`}
            </div>
            <div style={{ fontSize: 12, color: "#9A9A9A" }}>
              {editContent.length.toLocaleString()} chars
            </div>
          </div>

          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={20}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 10,
              border: "2px solid #E0DCD4", fontSize: 13, fontFamily: "monospace",
              lineHeight: 1.6, resize: "vertical", boxSizing: "border-box",
              background: "#FAFAF8",
            }}
          />

          <div style={{ marginTop: 12 }}>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Version notes (e.g., 'Added pet category support')"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1px solid #E0DCD4", fontSize: 13, fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={handleSaveNewVersion}
            disabled={saving || !editContent.trim()}
            style={{
              width: "100%", padding: 14, marginTop: 12,
              background: saving ? "#E8E4DC" : "#2D5A3D", color: "#fff",
              border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: saving ? "default" : "pointer", fontFamily: "inherit",
            }}
          >
            {saving ? "Saving..." : "Save as New Version"}
          </button>
        </div>

        {/* Version History */}
        {data.versions.length > 0 && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            border: "1px solid #E8E4DC",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 14 }}>
              Version History ({data.versions.length})
            </div>

            {[...data.versions].reverse().map(v => {
              const isActive = v.version === data.activeVersion;
              const isSelected = v.version === selectedVersion;
              return (
                <div key={v.version} style={{
                  padding: "14px 16px", borderRadius: 12, marginBottom: 8,
                  background: isSelected ? "#E8F0EA" : "#F9F8F5",
                  border: isActive ? "2px solid #2D5A3D" : "1px solid #E8E4DC",
                  cursor: "pointer",
                }} onClick={() => handleSelectVersion(v)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
                        v{v.version}
                      </span>
                      {isActive && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "#2D5A3D",
                          background: "#E8F0EA", padding: "2px 8px", borderRadius: 10,
                        }}>ACTIVE</span>
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                        background: v.source === "ai-suggested" ? "#F0E6FF" : "#F0F4FF",
                        color: v.source === "ai-suggested" ? "#7B3FBF" : "#5A7ABF",
                      }}>
                        {v.source}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#9A9A9A" }}>
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {v.notes && (
                    <div style={{ fontSize: 12, color: "#5A5A5A", marginTop: 4 }}>{v.notes}</div>
                  )}
                  <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 4 }}>
                    {v.content.length.toLocaleString()} chars
                  </div>

                  {!isActive && isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(v.version); }}
                      disabled={restoring === v.version}
                      style={{
                        marginTop: 8, padding: "8px 16px",
                        background: restoring === v.version ? "#E8E4DC" : "#D4932A",
                        color: "#fff", border: "none", borderRadius: 8,
                        fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {restoring === v.version ? "Restoring..." : "Restore This Version"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
