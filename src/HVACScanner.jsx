import { useState, useRef } from "react";

function amazonLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lifekeep-20`;
}

export default function HVACScanner() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("");
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const compressImage = (dataUrl, maxDim = 1200, quality = 0.7) => {
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
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = dataUrl;
    });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      setPreview(reader.result);
      const compressed = await compressImage(reader.result);
      let base64 = compressed.split(",")[1];
      if (base64.length > 3500000) {
        const smaller = await compressImage(reader.result, 800, 0.5);
        base64 = smaller.split(",")[1];
      }
      setImage({ base64, mediaType: "image/jpeg" });
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setPhase("Uploading image...");
      await new Promise(r => setTimeout(r, 300));

      setPhase("AI reading label text...");
      const resp = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.base64, mediaType: image.mediaType }),
      });

      setPhase("Identifying parts...");
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || `Server error ${resp.status}`);
      }

      if (data.error && !data.amazonSearches) {
        throw new Error(data.error);
      }

      setResult(data);
      setPhase("");
    } catch (err) {
      setError(err.message);
      setPhase("");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setPhase("");
  };

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
            <span style={{ fontSize: 13, color: "#9A9A9A", marginLeft: 10 }}>Label Scanner</span>
          </div>
          {(preview || result) && (
            <button onClick={reset} style={{
              background: "none", border: "1px solid #E0DCD4", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, color: "#5A5A5A", cursor: "pointer", fontFamily: "inherit",
            }}>Scan New</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Intro — no image yet */}
        {!preview && !result && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 32, marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", margin: 0, fontFamily: "Georgia, serif" }}>
                HVAC Label Scanner
              </h1>
              <p style={{ fontSize: 15, color: "#9A9A9A", marginTop: 8, lineHeight: 1.5 }}>
                Take a photo of your HVAC unit's label and we'll identify the exact replacement filter and parts
              </p>
            </div>

            {/* Hidden file inputs */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            {/* Camera button */}
            <button onClick={() => cameraRef.current?.click()} style={{
              width: "100%", padding: "28px 24px",
              background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
              border: "none", borderRadius: 16, cursor: "pointer",
              color: "#fff", textAlign: "center",
              boxShadow: "0 4px 16px rgba(45,90,61,0.3)",
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Take Photo of Label</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Opens your camera</div>
            </button>

            {/* Upload button */}
            <button onClick={() => fileRef.current?.click()} style={{
              width: "100%", padding: "20px 24px",
              background: "#fff", border: "2px solid #E0DCD4",
              borderRadius: 16, cursor: "pointer",
              textAlign: "center", marginBottom: 24,
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#2D5A3D" }}>Upload from Gallery</div>
              <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 2 }}>Choose an existing photo</div>
            </button>

            {/* Tips */}
            <div style={{
              background: "#fff", borderRadius: 14, padding: "20px",
              border: "1px solid #E8E4DC",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>Tips for best results</div>
              {[
                "Find the label on the side or back of your HVAC unit, air handler, or furnace",
                "Make sure the model number is clearly visible and in focus",
                "Include the full label — manufacturer name, model, and serial number",
                "Good lighting helps — use your phone's flashlight if needed",
              ].map((tip, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  marginBottom: i < 3 ? 10 : 0,
                }}>
                  <span style={{ fontSize: 14, color: "#2D5A3D", flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: "#5A5A5A", lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>

            {/* What it scans */}
            <div style={{
              marginTop: 12, background: "#E8F0EA", borderRadius: 14, padding: "16px 20px",
              fontSize: 13, color: "#2D5A3D", lineHeight: 1.7,
            }}>
              <strong>Works with:</strong> HVAC units, furnaces, air handlers, mini-splits, water heaters, and most appliances with a model number label. AI vision reads the label and cross-references filter sizes and replacement parts.
            </div>
          </div>
        )}

        {/* Preview — image selected, not yet scanned */}
        {preview && !result && !loading && (
          <div>
            <div style={{
              borderRadius: 16, overflow: "hidden", marginBottom: 20,
              border: "2px solid #E8E4DC",
            }}>
              <img src={preview} alt="Label preview" style={{
                width: "100%", maxHeight: 400, objectFit: "contain",
                background: "#f5f5f5",
              }} />
            </div>

            <button onClick={handleScan} style={{
              width: "100%", padding: "18px",
              background: "#2D5A3D", color: "#fff",
              border: "none", borderRadius: 14,
              fontSize: 17, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(45,90,61,0.3)",
            }}>
              Scan Label & Find Parts
            </button>

            {error && (
              <div style={{
                marginTop: 16, padding: "14px 20px", background: "#FDF0EE",
                borderRadius: 12, fontSize: 13, color: "#C44B3F", lineHeight: 1.6,
              }}>{error}</div>
            )}

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <button onClick={() => { reset(); setTimeout(() => cameraRef.current?.click(), 100); }} style={{
              width: "100%", padding: "14px", marginTop: 10,
              background: "none", border: "1px solid #E0DCD4",
              borderRadius: 14, fontSize: 14, color: "#5A5A5A",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Retake Photo
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div>
            {preview && (
              <div style={{
                borderRadius: 16, overflow: "hidden", marginBottom: 24,
                border: "2px solid #2D5A3D", opacity: 0.7,
              }}>
                <img src={preview} alt="Scanning" style={{
                  width: "100%", maxHeight: 300, objectFit: "contain", background: "#f5f5f5",
                }} />
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, border: "4px solid #E8E4DC",
                borderTopColor: "#2D5A3D", borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 0.8s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>{phase}</div>
              <div style={{ fontSize: 13, color: "#9A9A9A", marginTop: 6 }}>
                Using AI vision to read the label and identify parts
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Scanned image thumbnail */}
            {preview && (
              <div style={{
                borderRadius: 12, overflow: "hidden", marginBottom: 20,
                border: "1px solid #E8E4DC", maxHeight: 200,
              }}>
                <img src={preview} alt="Scanned label" style={{
                  width: "100%", maxHeight: 200, objectFit: "contain", background: "#f5f5f5",
                }} />
              </div>
            )}

            {/* Unit info card */}
            <div style={{
              background: "linear-gradient(135deg, #2D5A3D 0%, #3A7550 100%)",
              borderRadius: 16, padding: "24px 24px 20px", color: "#fff",
              position: "relative", overflow: "hidden", marginBottom: 20,
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>
                Identified Unit
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
                {result.manufacturer || "Unknown"} {result.modelNumber || ""}
              </div>

              <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                {result.filterSize && (
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Filter Size</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{result.filterSize}</div>
                  </div>
                )}
                {result.filterType && (
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Filter Type</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{result.filterType}</div>
                  </div>
                )}
                {result.serialNumber && (
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Serial</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{result.serialNumber}</div>
                  </div>
                )}
                {result.confidence && (
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Confidence</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, textTransform: "capitalize" }}>{result.confidence}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {result.notes && (
              <div style={{
                background: "#FBF6ED", borderRadius: 14, padding: "16px 20px",
                border: "1px solid #C4A26533", marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#C4A265", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>Notes</div>
                <div style={{ fontSize: 14, color: "#5A5A5A", lineHeight: 1.6 }}>{result.notes}</div>
              </div>
            )}

            {/* Amazon links */}
            {result.amazonSearches && result.amazonSearches.length > 0 && (
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: "#9A9A9A", letterSpacing: 1,
                  marginBottom: 10, textTransform: "uppercase",
                }}>
                  Shop Compatible Parts ({result.amazonSearches.length})
                </div>
                {result.amazonSearches.map((item, i) => (
                  <a
                    key={i}
                    href={amazonLink(item.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 18px", background: "#fff",
                      border: "1px solid #E8E4DC", borderRadius: 14,
                      textDecoration: "none", color: "#1A1A1A",
                      marginBottom: 10,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 26, flexShrink: 0 }}>🛒</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: "#9A9A9A", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.query}
                        </div>
                        <div style={{ fontSize: 11, color: "#C4A265", marginTop: 3, fontWeight: 500 }}>
                          Amazon · affiliate link
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 15, color: "#C4A265", fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>Shop →</span>
                  </a>
                ))}
              </div>
            )}

            {/* Raw text */}
            {result.rawText && (
              <details style={{ marginTop: 20 }}>
                <summary style={{
                  fontSize: 13, fontWeight: 600, color: "#9A9A9A", cursor: "pointer",
                  padding: "10px 0",
                }}>
                  View raw label text
                </summary>
                <div style={{
                  background: "#fff", borderRadius: 12, padding: "16px",
                  border: "1px solid #E8E4DC", marginTop: 8,
                  fontSize: 13, color: "#5A5A5A", lineHeight: 1.7,
                  fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {result.rawText}
                </div>
              </details>
            )}

            {/* Scan another */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => { reset(); handleFile(e); }} style={{ display: "none" }} />
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { reset(); handleFile(e); }} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => cameraRef.current?.click()} style={{
                flex: 1, padding: "14px",
                background: "#2D5A3D", color: "#fff", border: "none",
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                📸 Scan Another
              </button>
              <button onClick={() => fileRef.current?.click()} style={{
                flex: 1, padding: "14px",
                background: "#fff", color: "#5A5A5A",
                border: "1px solid #E0DCD4",
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                🖼️ Upload Another
              </button>
            </div>

            <div style={{
              marginTop: 16, padding: "14px 20px",
              background: "#E8F0EA", borderRadius: 14,
              fontSize: 13, color: "#2D5A3D", lineHeight: 1.7,
            }}>
              <strong>How this works:</strong> Your photo is sent to Claude's vision API which reads all text on the label, identifies the manufacturer and model, determines the correct filter size, and generates specific product search queries. Cost per scan: ~$0.03.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
