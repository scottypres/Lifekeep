// LLM Comparison Tester — Training Data Storage
// Separate from existing training.js to avoid interference

const STORAGE_KEY = "lifekeep_compare_log";

function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLog(log) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {}
}

export function saveComparisonRun(run) {
  const log = loadLog();
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    ...run,
  };
  log.unshift(entry);
  saveLog(log);

  // Also POST to server (fire-and-forget)
  try {
    fetch("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "llm-compare", ...entry }),
    }).catch(() => {});
  } catch {}

  return entry;
}

export function getComparisonLog() {
  return loadLog();
}

export function deleteComparisonRun(id) {
  const log = loadLog().filter(e => e.id !== id);
  saveLog(log);
}

export function clearComparisonLog() {
  saveLog([]);
}

export function exportComparisonReport(log) {
  if (!log) log = loadLog();
  if (log.length === 0) return "No comparison data to export.";

  const lines = ["LIFEKEEP LLM COMPARISON REPORT", `Generated: ${new Date().toISOString()}`, `Total runs: ${log.length}`, ""];

  for (const run of log) {
    lines.push(`=== Run: ${run.timestamp} ===`);
    if (run.notes) lines.push(`Notes: ${run.notes}`);

    for (let step = 1; step <= 5; step++) {
      const stepKey = `step${step}`;
      const stepData = run.steps?.[stepKey];
      if (!stepData?.results) continue;

      lines.push(`\n  Step ${step}:`);
      for (const [model, r] of Object.entries(stepData.results)) {
        const rating = r.rating || "unrated";
        const selected = r.wasSelected ? " [SELECTED]" : "";
        lines.push(`    ${model}: ${r.elapsed}ms, $${r.cost?.toFixed(4) || "?"}, rating=${rating}${selected}`);
        if (r.feedback) lines.push(`      Feedback: ${r.feedback}`);
      }
    }

    if (run.bestCombination) {
      lines.push("\n  Best combination:");
      for (const [step, model] of Object.entries(run.bestCombination)) {
        lines.push(`    ${step}: ${model}`);
      }
    }
    if (run.totalCost) lines.push(`  Total cost: $${run.totalCost.toFixed(4)}`);
    lines.push("");
  }

  return lines.join("\n");
}
