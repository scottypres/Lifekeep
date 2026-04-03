import { readFileSync, existsSync } from "fs";

const PROMPTS_PATH = "/tmp/lifekeep_prompts.json";

function getActivePromptContent() {
  try {
    if (existsSync(PROMPTS_PATH)) {
      const data = JSON.parse(readFileSync(PROMPTS_PATH, "utf-8"));
      if (data.activeVersion && data.versions) {
        const active = data.versions.find(v => v.version === data.activeVersion);
        if (active?.content) return active.content;
      }
    }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { trainingData, currentPrompt } = req.body;
  if (!trainingData || trainingData.length === 0) {
    return res.status(400).json({ error: "No training data provided" });
  }

  const activePrompt = currentPrompt || getActivePromptContent();

  // Summarize training feedback for the meta-prompt (exclude images to save tokens)
  const feedbackSummary = trainingData.map(entry => {
    const item = entry.aiResult?.item || "Unknown";
    const identCorrect = entry.identificationFeedback?.correct;
    const identCorrection = entry.identificationFeedback?.correction;
    const tasks = (entry.taskFeedback || []).map(tf => {
      let line = `  [${tf.rating || "unrated"}] ${tf.taskName}`;
      if (tf.feedbackText) line += ` — ${tf.feedbackText}`;
      return line;
    }).join("\n");
    const notes = entry.overallNotes || "";

    let summary = `Item: ${item}`;
    if (identCorrect === false) summary += ` (WRONG — should be: ${identCorrection || "unknown"})`;
    if (tasks) summary += `\nTasks:\n${tasks}`;
    if (notes) summary += `\nNotes: ${notes}`;
    return summary;
  }).join("\n---\n");

  const metaPrompt = `You are helping improve an AI system prompt for a product maintenance app called Lifekeep. Users scan photos of items they own, and the AI identifies the product and suggests prioritized maintenance tasks.

Below is the current system prompt and a collection of user feedback on the AI's outputs. Analyze the patterns in the feedback — what kinds of tasks are rated poorly? What identifications are wrong? What are users consistently asking for?

Based on this analysis, suggest specific improvements to the system prompt. Your goal is to make the AI produce better, more relevant maintenance suggestions.

CURRENT PROMPT:
---
${activePrompt || "(No custom prompt set — using default)"}
---

USER FEEDBACK (${trainingData.length} entries):
---
${feedbackSummary}
---

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "reasoning": "2-3 sentences explaining what patterns you found and what changes you're making",
  "suggestedPrompt": "The complete updated prompt text"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: metaPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "API error: " + errText.slice(0, 300) });
    }

    const data = await response.json();
    const text = data.content.map(c => c.type === "text" ? c.text : "").join("").trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    try {
      return res.status(200).json(JSON.parse(clean));
    } catch {
      return res.status(200).json({ suggestedPrompt: clean, reasoning: "Could not parse structured response" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
