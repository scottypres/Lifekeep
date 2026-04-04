import { useState, useRef } from "react";
import { MODELS, STEP_LABELS, PRICING, getPrompt } from "./llm-prompts";
import { getApiKeys } from "./LLMSettings";
import { saveComparisonRun } from "./compare-training";

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

const PROVIDER_KEY_MAP = {
  Anthropic: "anthropic",
  OpenAI: "openai",
  Google: "gemini",
};

const PROVIDERS_ORDERED = ["Anthropic", "OpenAI", "Google"];

function formatCost(inputTokens, outputTokens, modelId) {
  if (!PRICING[modelId]) return "$?.??";
  const [inRate, outRate] = PRICING[modelId];
  const cost = (inputTokens * inRate + outputTokens * outRate) / 1_000_000;
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(3)}`;
}

function tryParseJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Try stripping markdown code fences
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    try {
      return JSON.parse(stripped);
    } catch {
      return null;
    }
  }
}

function timestamp() {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

export default function LLMCompare() {
  // --- State ---
  const [phase, setPhase] = useState("upload"); // upload | running | summary
  const [image, setImage] = useState(null); // compressed base64
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedModels, setSelectedModels] = useState(() => {
    return new Set(MODELS.map((m) => m.id));
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [stepResults, setStepResults] = useState({});
  const [stepRatings, setStepRatings] = useState({});
  const [selectedOutputs, setSelectedOutputs] = useState({});
  const [editedOutputs, setEditedOutputs] = useState({});
  const [runningModels, setRunningModels] = useState(new Set());
  const [notes, setNotes] = useState("");
  const [debugPanel, setDebugPanel] = useState(false);
  const [, forceUpdate] = useState(0);

  const debugLog = useRef([]);
  const debugEndRef = useRef(null);

  function addDebug(msg) {
    debugLog.current.push(`[${timestamp()}] ${msg}`);
    forceUpdate((n) => n + 1);
  }

  // --- Helpers ---
  function hasProviderKey(provider) {
    const keys = getApiKeys();
    const provKey = PROVIDER_KEY_MAP[provider];
    // Client-side keys are optional — server env vars are used as fallback
    // Always return true so models aren't grayed out
    return keys[provKey] ? "local" : "env";
  }

  function getSelectedOutput(step) {
    const stepKey = `step${step}`;
    if (editedOutputs[stepKey]) return editedOutputs[stepKey];
    const modelId = selectedOutputs[stepKey];
    if (!modelId) return "";
    const result = stepResults[stepKey]?.[modelId];
    if (!result) return "";
    if (typeof result.output === "string") return result.output;
    return JSON.stringify(result.output, null, 2);
  }

  function buildContext(step) {
    switch (step) {
      case 1:
        return {};
      case 2:
        return { ocrText: getSelectedOutput(1) };
      case 3:
        return { identifiedProduct: getSelectedOutput(2) };
      case 4:
        return {
          identifiedProduct: getSelectedOutput(2),
          partsSpec: getSelectedOutput(3),
        };
      case 5:
        return { partsSpec: getSelectedOutput(3) };
      default:
        return {};
    }
  }

  // --- Image Upload ---
  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target.result;
      setImagePreview(raw);
      const compressed = await compressImage(raw);
      const base64 = compressed.split(",")[1];
      setImage(base64);
      addDebug(`Image loaded and compressed (${Math.round(base64.length / 1024)}KB base64)`);
    };
    reader.readAsDataURL(file);
  }

  // --- Model Selection ---
  function toggleModel(modelId) {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  }

  function selectAll() {
    setSelectedModels(new Set(MODELS.map((m) => m.id)));
  }

  function deselectAll() {
    setSelectedModels(new Set());
  }

  // --- Run Step ---
  async function runStep() {
    const stepKey = `step${currentStep}`;
    const apiKeys = getApiKeys();
    const context = buildContext(currentStep);
    const modelsToRun = MODELS.filter((m) => selectedModels.has(m.id));

    addDebug(`--- Running Step ${currentStep}: ${STEP_LABELS[currentStep]} ---`);
    addDebug(`Models: ${modelsToRun.map((m) => m.label).join(", ")}`);

    const newRunning = new Set(modelsToRun.map((m) => m.id));
    setRunningModels(newRunning);

    // Clear previous results for this step
    setStepResults((prev) => ({ ...prev, [stepKey]: {} }));

    const imageBase64 = currentStep === 1 ? image : undefined;

    const promises = modelsToRun.map(async (model) => {
      const prompt = getPrompt(currentStep, model.id, context);
      const startTime = Date.now();
      addDebug(`[${model.label}] Sending request...`);

      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: currentStep,
            model: model.id,
            prompt,
            image: imageBase64,
            mediaType: "image/jpeg",
            apiKeys,
          }),
        });

        const elapsed = Date.now() - startTime;

        if (!res.ok) {
          const errText = await res.text().catch(() => "Unknown error");
          addDebug(`[${model.label}] ERROR ${res.status}: ${errText.slice(0, 200)}`);
          setStepResults((prev) => ({
            ...prev,
            [stepKey]: {
              ...prev[stepKey],
              [model.id]: { error: `HTTP ${res.status}: ${errText.slice(0, 300)}`, elapsed },
            },
          }));
        } else {
          const data = await res.json();
          const t = data.timing || {};
          addDebug(
            `[${model.label}] OK — roundtrip:${elapsed}ms, api:${t.api ?? "?"}ms, overhead:${elapsed - (t.api || 0)}ms — in:${data.inputTokens || "?"} out:${data.outputTokens || "?"}`
          );
          setStepResults((prev) => ({
            ...prev,
            [stepKey]: {
              ...prev[stepKey],
              [model.id]: {
                output: data.output || data.rawOutput || "",
                rawOutput: data.rawOutput || "",
                inputTokens: data.inputTokens || 0,
                outputTokens: data.outputTokens || 0,
                elapsed,
                timing: {
                  roundtrip: elapsed,
                  api: t.api || null,
                  vercel: t.overhead || null,
                  network: t.api ? elapsed - t.total : null,
                },
              },
            },
          }));
        }
      } catch (err) {
        const elapsed = Date.now() - startTime;
        addDebug(`[${model.label}] FETCH ERROR: ${err.message}`);
        setStepResults((prev) => ({
          ...prev,
          [stepKey]: {
            ...prev[stepKey],
            [model.id]: { error: err.message, elapsed },
          },
        }));
      } finally {
        setRunningModels((prev) => {
          const next = new Set(prev);
          next.delete(model.id);
          return next;
        });
      }
    });

    await Promise.allSettled(promises);
    addDebug(`Step ${currentStep} complete.`);
  }

  // --- Ratings ---
  function setRating(step, modelId, rating) {
    const stepKey = `step${step}`;
    setStepRatings((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [modelId]: { ...(prev[stepKey]?.[modelId] || {}), rating },
      },
    }));
  }

  function setFeedback(step, modelId, feedback) {
    const stepKey = `step${step}`;
    setStepRatings((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [modelId]: { ...(prev[stepKey]?.[modelId] || {}), feedback },
      },
    }));
  }

  // --- Proceed ---
  function proceedToNextStep() {
    if (currentStep >= 5) {
      setPhase("summary");
      return;
    }
    setCurrentStep((s) => s + 1);
  }

  // --- Save ---
  function handleSave() {
    saveComparisonRun({
      stepResults,
      stepRatings,
      selectedOutputs,
      editedOutputs,
      selectedModels: [...selectedModels],
      notes,
    });
    addDebug("Comparison run saved.");
    alert("Comparison run saved to local storage.");
  }

  function handleStartOver() {
    setPhase("upload");
    setImage(null);
    setImagePreview(null);
    setCurrentStep(1);
    setStepResults({});
    setStepRatings({});
    setSelectedOutputs({});
    setEditedOutputs({});
    setRunningModels(new Set());
    setNotes("");
    debugLog.current = [];
  }

  // --- Render Helpers ---
  function renderOutputContent(result) {
    if (result.error) {
      return (
        <div style={{ color: "#C44", fontWeight: 600, fontSize: 13 }}>
          {result.error}
        </div>
      );
    }

    const raw = typeof result.output === "string" ? result.output : JSON.stringify(result.output);
    const parsed = tryParseJSON(raw);

    if (parsed) {
      return (
        <pre
          style={{
            background: "#FAFAF7",
            border: "1px solid #E8E4DC",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            lineHeight: 1.5,
            overflow: "auto",
            maxHeight: 300,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    }

    return (
      <div>
        <span
          style={{
            display: "inline-block",
            background: "#FEF3C7",
            color: "#92400E",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            marginBottom: 6,
          }}
        >
          Parse failed
        </span>
        <pre
          style={{
            background: "#FAFAF7",
            border: "1px solid #E8E4DC",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            lineHeight: 1.5,
            overflow: "auto",
            maxHeight: 300,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {result.rawOutput || raw}
        </pre>
      </div>
    );
  }

  // --- Styles ---
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(145deg, #F7F5F0 0%, #EDE9E0 100%)",
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    },
    inner: {
      maxWidth: 600,
      margin: "0 auto",
    },
    card: {
      background: "#fff",
      border: "1px solid #E8E4DC",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionHeader: {
      fontSize: 20,
      fontWeight: 700,
      color: "#2D5A3D",
      marginBottom: 12,
    },
    subHeader: {
      fontSize: 18,
      fontWeight: 700,
      color: "#2D5A3D",
      marginBottom: 8,
    },
    btn: {
      borderRadius: 10,
      padding: "12px 20px",
      fontWeight: 600,
      fontSize: 14,
      border: "none",
      cursor: "pointer",
    },
    btnPrimary: {
      background: "#2D5A3D",
      color: "#fff",
    },
    btnGold: {
      background: "#D4932A",
      color: "#fff",
    },
    btnOutline: {
      background: "transparent",
      border: "2px solid #2D5A3D",
      color: "#2D5A3D",
    },
    btnSmall: {
      padding: "6px 14px",
      fontSize: 12,
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      color: "#555",
      marginBottom: 4,
    },
  };

  const ratingBtn = (active, color) => ({
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: `2px solid ${active ? color : "#DDD"}`,
    background: active ? color : "#fff",
    color: active ? "#fff" : "#999",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    marginRight: 6,
  });

  // ===== RENDER =====
  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "inline-block",
              background: "#D4932A",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 6,
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            DEV MODE
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2D5A3D", margin: 0 }}>
            LLM Comparison Tester
          </h1>
          <p style={{ fontSize: 14, color: "#777", margin: "4px 0 0" }}>
            Compare model outputs across each pipeline step
          </p>
        </div>

        {/* ========== UPLOAD PHASE ========== */}
        {phase === "upload" && (
          <>
            {/* Image Upload */}
            <div style={styles.card}>
              <div style={styles.sectionHeader}>1. Upload Product Image</div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ marginBottom: 12, fontSize: 14 }}
              />
              {imagePreview && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      borderRadius: 8,
                      border: "1px solid #E8E4DC",
                    }}
                  />
                  {image && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                      Compressed: {Math.round(image.length / 1024)}KB base64
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div style={styles.card}>
              <div style={styles.sectionHeader}>2. Select Models</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button
                  style={{ ...styles.btn, ...styles.btnSmall, ...styles.btnOutline }}
                  onClick={selectAll}
                >
                  Select All
                </button>
                <button
                  style={{ ...styles.btn, ...styles.btnSmall, ...styles.btnOutline }}
                  onClick={deselectAll}
                >
                  Deselect All
                </button>
              </div>
              {PROVIDERS_ORDERED.map((provider) => {
                const keySource = hasProviderKey(provider);
                const providerModels = MODELS.filter((m) => m.provider === provider);
                return (
                  <div key={provider} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#2D5A3D",
                        marginBottom: 4,
                      }}
                    >
                      {provider}
                      {keySource === "env" && (
                        <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 6, color: "#999" }}>
                          (using server key)
                        </span>
                      )}
                    </div>
                    {providerModels.map((m) => (
                      <label
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 0",
                          cursor: "pointer",
                          opacity: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModels.has(m.id)}
                          disabled={false}
                          onChange={() => toggleModel(m.id)}
                        />
                        <span style={{ fontSize: 14 }}>{m.label}</span>
                        <span style={{ fontSize: 11, color: "#999" }}>{m.id}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Start Button */}
            {image && selectedModels.size > 0 && (
              <button
                style={{ ...styles.btn, ...styles.btnPrimary, width: "100%" }}
                onClick={() => setPhase("running")}
              >
                Start Comparison ({selectedModels.size} model{selectedModels.size !== 1 ? "s" : ""})
              </button>
            )}
          </>
        )}

        {/* ========== RUNNING PHASE ========== */}
        {phase === "running" && (
          <>
            {/* Step Header */}
            <div style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      background: s === currentStep ? "#2D5A3D" : s < currentStep ? "#A7C4B5" : "#E8E4DC",
                      color: s <= currentStep ? "#fff" : "#999",
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
              <div style={styles.sectionHeader}>
                Step {currentStep}: {STEP_LABELS[currentStep]}
              </div>

              {/* Run Button */}
              {!stepResults[`step${currentStep}`] ||
              Object.keys(stepResults[`step${currentStep}`] || {}).length === 0 ? (
                <button
                  style={{ ...styles.btn, ...styles.btnGold, width: "100%" }}
                  onClick={runStep}
                  disabled={runningModels.size > 0}
                >
                  {runningModels.size > 0 ? "Running..." : `Run Step ${currentStep}`}
                </button>
              ) : null}
            </div>

            {/* Results */}
            {MODELS.filter((m) => selectedModels.has(m.id)).map((model) => {
              const stepKey = `step${currentStep}`;
              const result = stepResults[stepKey]?.[model.id];
              const isRunning = runningModels.has(model.id);
              const rating = stepRatings[stepKey]?.[model.id];
              const isSelected = selectedOutputs[stepKey] === model.id;

              return (
                <div
                  key={model.id}
                  style={{
                    ...styles.card,
                    borderColor: isSelected ? "#2D5A3D" : "#E8E4DC",
                    borderWidth: isSelected ? 2 : 1,
                  }}
                >
                  {/* Model header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#2D5A3D" }}>
                        {model.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#999" }}>{model.provider}</div>
                    </div>
                    {result && !result.error && (
                      <div style={{ textAlign: "right", fontSize: 12, color: "#777" }}>
                        <div style={{ fontWeight: 600, color: "#2D5A3D" }}>
                          {result.timing?.api != null ? `${result.timing.api}ms` : `${result.elapsed}ms`}
                          <span style={{ fontWeight: 400, color: "#BBB" }}> model</span>
                        </div>
                        {result.timing?.api != null && (
                          <div style={{ fontSize: 11, color: "#BBB" }}>
                            +{result.timing.roundtrip - result.timing.api}ms network/vercel
                          </div>
                        )}
                        <div>
                          in: {result.inputTokens} / out: {result.outputTokens}
                        </div>
                        <div>{formatCost(result.inputTokens, result.outputTokens, model.id)}</div>
                      </div>
                    )}
                    {result && result.error && (
                      <div style={{ fontSize: 12, color: "#C44", fontWeight: 600 }}>
                        {result.elapsed}ms
                      </div>
                    )}
                  </div>

                  {/* Running indicator */}
                  {isRunning && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#D4932A",
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "12px 0",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#D4932A",
                          display: "inline-block",
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      />
                      Running...
                    </div>
                  )}

                  {/* Output */}
                  {result && !isRunning && (
                    <>
                      <div style={{ marginBottom: 10 }}>{renderOutputContent(result)}</div>

                      {/* Rating + Select Row */}
                      {!result.error && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          {/* Ratings */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 12, color: "#777", marginRight: 4 }}>Rate:</span>
                            <button
                              style={ratingBtn(rating?.rating === "good", "#2D5A3D")}
                              onClick={() => setRating(currentStep, model.id, "good")}
                              title="Good"
                            >
                              &#10003;
                            </button>
                            <button
                              style={ratingBtn(rating?.rating === "ok", "#D4932A")}
                              onClick={() => setRating(currentStep, model.id, "ok")}
                              title="OK"
                            >
                              !
                            </button>
                            <button
                              style={ratingBtn(rating?.rating === "bad", "#C44")}
                              onClick={() => setRating(currentStep, model.id, "bad")}
                              title="Bad"
                            >
                              &#10005;
                            </button>
                          </div>

                          {/* Select radio */}
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              color: isSelected ? "#2D5A3D" : "#777",
                            }}
                          >
                            <input
                              type="radio"
                              name={`select-${stepKey}`}
                              checked={isSelected}
                              onChange={() =>
                                setSelectedOutputs((prev) => ({
                                  ...prev,
                                  [stepKey]: model.id,
                                }))
                              }
                            />
                            Use for next step
                          </label>
                        </div>
                      )}

                      {/* Feedback */}
                      {!result.error && (
                        <textarea
                          placeholder="Optional feedback..."
                          value={rating?.feedback || ""}
                          onChange={(e) => setFeedback(currentStep, model.id, e.target.value)}
                          style={{
                            width: "100%",
                            marginTop: 8,
                            padding: 8,
                            fontSize: 12,
                            border: "1px solid #E8E4DC",
                            borderRadius: 8,
                            resize: "vertical",
                            minHeight: 36,
                            fontFamily: "'DM Sans', sans-serif",
                            boxSizing: "border-box",
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Edit before next step */}
            {selectedOutputs[`step${currentStep}`] && (
              <div style={styles.card}>
                <div style={styles.subHeader}>Edit Before Next Step</div>
                <p style={{ fontSize: 12, color: "#777", margin: "0 0 8px" }}>
                  Optionally modify the selected output before it is passed to the next step.
                </p>
                <textarea
                  value={
                    editedOutputs[`step${currentStep}`] !== undefined &&
                    editedOutputs[`step${currentStep}`] !== null
                      ? editedOutputs[`step${currentStep}`]
                      : getSelectedOutput(currentStep)
                  }
                  onChange={(e) =>
                    setEditedOutputs((prev) => ({
                      ...prev,
                      [`step${currentStep}`]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    minHeight: 120,
                    padding: 10,
                    fontSize: 12,
                    fontFamily: "monospace",
                    border: "1px solid #E8E4DC",
                    borderRadius: 8,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnPrimary,
                    width: "100%",
                    marginTop: 10,
                  }}
                  onClick={proceedToNextStep}
                >
                  {currentStep < 5
                    ? `Proceed to Step ${currentStep + 1}`
                    : "Finish & View Summary"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ========== SUMMARY PHASE ========== */}
        {phase === "summary" && (
          <>
            <div style={styles.card}>
              <div style={styles.sectionHeader}>Comparison Summary</div>

              {/* Summary Table */}
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E8E4DC" }}>
                      <th style={{ textAlign: "left", padding: "8px 6px", color: "#2D5A3D" }}>Model</th>
                      <th style={{ textAlign: "right", padding: "8px 6px", color: "#2D5A3D" }}>
                        Total Time
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 6px", color: "#2D5A3D" }}>
                        Total Cost
                      </th>
                      <th style={{ textAlign: "center", padding: "8px 6px", color: "#2D5A3D" }}>
                        Ratings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODELS.filter((m) => selectedModels.has(m.id)).map((model) => {
                      let totalTime = 0;
                      let totalInputTokens = 0;
                      let totalOutputTokens = 0;
                      let ratingCounts = { good: 0, ok: 0, bad: 0 };

                      for (let s = 1; s <= 5; s++) {
                        const sk = `step${s}`;
                        const r = stepResults[sk]?.[model.id];
                        if (r && !r.error) {
                          totalTime += r.elapsed || 0;
                          totalInputTokens += r.inputTokens || 0;
                          totalOutputTokens += r.outputTokens || 0;
                        }
                        const rt = stepRatings[sk]?.[model.id]?.rating;
                        if (rt) ratingCounts[rt]++;
                      }

                      return (
                        <tr key={model.id} style={{ borderBottom: "1px solid #F0EDE7" }}>
                          <td style={{ padding: "8px 6px" }}>
                            <div style={{ fontWeight: 600 }}>{model.label}</div>
                            <div style={{ fontSize: 11, color: "#999" }}>{model.provider}</div>
                          </td>
                          <td style={{ padding: "8px 6px", textAlign: "right" }}>
                            {(totalTime / 1000).toFixed(1)}s
                          </td>
                          <td style={{ padding: "8px 6px", textAlign: "right" }}>
                            {formatCost(totalInputTokens, totalOutputTokens, model.id)}
                          </td>
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            {ratingCounts.good > 0 && (
                              <span style={{ color: "#2D5A3D", fontWeight: 600, marginRight: 4 }}>
                                {ratingCounts.good}&#10003;
                              </span>
                            )}
                            {ratingCounts.ok > 0 && (
                              <span style={{ color: "#D4932A", fontWeight: 600, marginRight: 4 }}>
                                {ratingCounts.ok}!
                              </span>
                            )}
                            {ratingCounts.bad > 0 && (
                              <span style={{ color: "#C44", fontWeight: 600 }}>
                                {ratingCounts.bad}&#10005;
                              </span>
                            )}
                            {ratingCounts.good === 0 && ratingCounts.ok === 0 && ratingCounts.bad === 0 && (
                              <span style={{ color: "#CCC" }}>--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Best Combination */}
            <div style={styles.card}>
              <div style={styles.subHeader}>Best Combination</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const sk = `step${s}`;
                  const chosen = selectedOutputs[sk];
                  const model = MODELS.find((m) => m.id === chosen);
                  return (
                    <div key={s}>
                      <span style={{ fontWeight: 600, color: "#2D5A3D" }}>Step {s}:</span>{" "}
                      {model ? model.label : <span style={{ color: "#CCC" }}>none selected</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div style={styles.card}>
              <div style={styles.subHeader}>Overall Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes about this comparison run..."
                style={{
                  width: "100%",
                  minHeight: 100,
                  padding: 10,
                  fontSize: 13,
                  border: "1px solid #E8E4DC",
                  borderRadius: 8,
                  resize: "vertical",
                  fontFamily: "'DM Sans', sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary, flex: 1 }}
                onClick={handleSave}
              >
                Save Results
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnOutline, flex: 1 }}
                onClick={handleStartOver}
              >
                Start Over
              </button>
            </div>
          </>
        )}

        {/* ========== DEBUG PANEL ========== */}
        <div style={{ marginTop: 32 }}>
          <button
            style={{
              ...styles.btn,
              ...styles.btnSmall,
              background: "#1A1A1A",
              color: "#4ADE80",
              fontFamily: "monospace",
              fontSize: 12,
              width: "100%",
              textAlign: "left",
            }}
            onClick={() => setDebugPanel((p) => !p)}
          >
            {debugPanel ? "Hide" : "Show"} Debug Log ({debugLog.current.length} entries)
          </button>
          {debugPanel && (
            <div
              style={{
                background: "#1A1A1A",
                color: "#4ADE80",
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 1.6,
                padding: 16,
                borderRadius: "0 0 12px 12px",
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnSmall,
                    background: "#333",
                    color: "#4ADE80",
                    fontFamily: "monospace",
                    border: "1px solid #4ADE80",
                  }}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(debugLog.current.join("\n"))
                      .then(() => addDebug("Debug log copied to clipboard."))
                      .catch(() => {});
                  }}
                >
                  Copy Debug Log
                </button>
              </div>
              {debugLog.current.length === 0 && (
                <div style={{ color: "#666" }}>No log entries yet.</div>
              )}
              {debugLog.current.map((entry, i) => (
                <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {entry}
                </div>
              ))}
              <div ref={debugEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Pulse animation for running indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
