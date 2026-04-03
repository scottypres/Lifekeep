// In-memory store (persists per serverless instance — for production, use a database)
// For demo purposes, we use Vercel's /tmp filesystem which persists within a single deployment
import { readFileSync, writeFileSync, existsSync } from "fs";

const LOG_PATH = "/tmp/lifekeep_training_log.json";

function readLog() {
  try {
    if (existsSync(LOG_PATH)) {
      return JSON.parse(readFileSync(LOG_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

function writeLog(data) {
  writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — download training log
  if (req.method === "GET") {
    const format = req.query.format;
    const log = readLog();

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=lifekeep-training-log.json");
      return res.status(200).json(log);
    }

    // Default: formatted text report
    let output = `# Lifekeep Scan Training Data\n`;
    output += `# Downloaded: ${new Date().toISOString()}\n`;
    output += `# Entries: ${log.length}\n\n`;

    log.forEach((entry, i) => {
      output += `${"=".repeat(60)}\n`;
      output += `## Scan #${i + 1} — ${entry.timestamp}\n`;
      output += `Item: ${entry.aiResult?.item || "Unknown"}\n`;
      output += `Brand: ${entry.aiResult?.brand || "Unknown"}\n`;
      output += `Model: ${entry.aiResult?.model || "Unknown"}\n`;
      output += `Category: ${entry.aiResult?.category || "Unknown"}\n`;
      output += `Confidence: ${entry.aiResult?.confidence || "Unknown"}\n`;
      if (entry.ocrText) output += `OCR Text: ${entry.ocrText}\n`;
      output += `\n`;

      if (entry.identificationFeedback) {
        output += `### Identification\n`;
        output += `Correct: ${entry.identificationFeedback.correct ? "YES" : "NO"}\n`;
        if (entry.identificationFeedback.correction) {
          output += `Correction: ${entry.identificationFeedback.correction}\n`;
        }
        output += `\n`;
      }

      if (entry.taskFeedback && entry.taskFeedback.length > 0) {
        output += `### Task Feedback\n`;
        entry.taskFeedback.forEach((tf) => {
          const icon = tf.rating === "good" ? "OK" : tf.rating === "bad" ? "BAD" : "MEH";
          output += `[${icon}] ${tf.taskName}\n`;
          if (tf.feedbackText) output += `   Feedback: ${tf.feedbackText}\n`;
          if (tf.correction) output += `   Correction: ${tf.correction}\n`;
          if (tf.productFeedback) {
            tf.productFeedback.forEach((pf) => {
              output += `   [${pf.correct ? "OK" : "BAD"}] Product: ${pf.productName}\n`;
              if (pf.feedbackText) output += `      Feedback: ${pf.feedbackText}\n`;
              if (pf.correction) output += `      Correction: ${pf.correction}\n`;
            });
          }
        });
        output += `\n`;
      }

      if (entry.overallNotes) {
        output += `### Notes\n${entry.overallNotes}\n\n`;
      }

      output += `### Raw AI Response\n`;
      output += `\`\`\`json\n${JSON.stringify(entry.aiResult, null, 2)}\n\`\`\`\n\n`;
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=lifekeep-training-log.txt");
    return res.status(200).send(output);
  }

  // POST — save training entry
  if (req.method === "POST") {
    try {
      const entry = req.body;
      entry.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      entry.timestamp = new Date().toISOString();

      const log = readLog();
      log.push(entry);
      writeLog(log);

      return res.status(200).json({ success: true, id: entry.id, total: log.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT — update a specific training entry by id
  if (req.method === "PUT") {
    try {
      const { id, updates } = req.body;
      if (!id) return res.status(400).json({ error: "Entry id required" });

      const log = readLog();
      const idx = log.findIndex(e => e.id === id);
      if (idx === -1) return res.status(404).json({ error: "Entry not found" });

      log[idx] = { ...log[idx], ...updates, id: log[idx].id, timestamp: log[idx].timestamp };
      writeLog(log);

      return res.status(200).json({ success: true, id, total: log.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE — clear log or delete single entry
  if (req.method === "DELETE") {
    const id = req.query.id;
    if (id) {
      const log = readLog();
      const filtered = log.filter(e => e.id !== id);
      if (filtered.length === log.length) {
        return res.status(404).json({ error: "Entry not found" });
      }
      writeLog(filtered);
      return res.status(200).json({ success: true, deleted: id, total: filtered.length });
    }
    writeLog([]);
    return res.status(200).json({ success: true, message: "Training log cleared" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
