const TRAINING_KEY = "lifekeep_training_log";

export function getTrainingLog() {
  try {
    return JSON.parse(localStorage.getItem(TRAINING_KEY) || "[]");
  } catch { return []; }
}

export function saveTrainingEntry(entry) {
  const log = getTrainingLog();
  entry.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  entry.timestamp = new Date().toISOString();
  log.push(entry);
  localStorage.setItem(TRAINING_KEY, JSON.stringify(log));
  return entry;
}

export function updateTrainingEntry(id, updates) {
  const log = getTrainingLog();
  const idx = log.findIndex(e => e.id === id);
  if (idx === -1) return null;
  log[idx] = { ...log[idx], ...updates, id: log[idx].id, timestamp: log[idx].timestamp };
  localStorage.setItem(TRAINING_KEY, JSON.stringify(log));
  return log[idx];
}

export function deleteTrainingEntry(id) {
  const log = getTrainingLog().filter(e => e.id !== id);
  localStorage.setItem(TRAINING_KEY, JSON.stringify(log));
  return log;
}

export function clearTrainingLog() {
  localStorage.removeItem(TRAINING_KEY);
}

export function exportTrainingLog() {
  const log = getTrainingLog();
  if (log.length === 0) return "No training data yet.";

  let output = `# Lifekeep Scan Training Data\n`;
  output += `# Exported: ${new Date().toISOString()}\n`;
  output += `# Entries: ${log.length}\n\n`;

  log.forEach((entry, i) => {
    output += `${"=".repeat(60)}\n`;
    output += `## Scan #${i + 1} — ${entry.timestamp}\n`;
    output += `Item identified: ${entry.aiResult?.item || "Unknown"}\n`;
    output += `Brand: ${entry.aiResult?.brand || "Unknown"}\n`;
    output += `Model: ${entry.aiResult?.model || "Unknown"}\n`;
    output += `Category: ${entry.aiResult?.category || "Unknown"}\n`;
    output += `Confidence: ${entry.aiResult?.confidence || "Unknown"}\n\n`;

    if (entry.identificationFeedback) {
      output += `### Identification Feedback\n`;
      output += `Correct: ${entry.identificationFeedback.correct ? "YES" : "NO"}\n`;
      if (entry.identificationFeedback.correction) {
        output += `Correction: ${entry.identificationFeedback.correction}\n`;
      }
      output += `\n`;
    }

    if (entry.taskFeedback && entry.taskFeedback.length > 0) {
      output += `### Task Feedback\n`;
      entry.taskFeedback.forEach((tf) => {
        const icon = tf.rating === "good" ? "✅" : tf.rating === "bad" ? "❌" : "⚠️";
        output += `${icon} ${tf.taskName}\n`;
        if (tf.issue) output += `   Issue: ${tf.issue}\n`;
        if (tf.correction) output += `   Should be: ${tf.correction}\n`;
        if (tf.productFeedback) {
          tf.productFeedback.forEach((pf) => {
            const pIcon = pf.correct ? "✅" : "❌";
            output += `   ${pIcon} Product: ${pf.productName}\n`;
            if (pf.correction) output += `      Should be: ${pf.correction}\n`;
          });
        }
      });
      output += `\n`;
    }

    if (entry.overallNotes) {
      output += `### Overall Notes\n${entry.overallNotes}\n\n`;
    }

    if (entry.aiResult?.maintenanceSchedule) {
      output += `### Raw AI Output (for reference)\n`;
      output += `\`\`\`json\n${JSON.stringify(entry.aiResult, null, 2)}\n\`\`\`\n\n`;
    }
  });

  return output;
}
