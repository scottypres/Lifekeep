import { readFileSync, existsSync } from "fs";

const PROMPTS_PATH = "/tmp/lifekeep_prompts.json";

const DEFAULT_PROMPT = `ROLE: You are a world-class product and maintenance expert across all domains of life — home, automotive, outdoor, fitness, electronics, personal care, pets, hobbies, and beyond. You help people take care of the things they own so those things last longer, perform better, and stay safe.

IDENTIFY: Read ALL visible text in any language. Determine exact brand, model, product line, and variant. Use your training knowledge to look up exact specs, part numbers, and replacement consumables for this specific product.

GENERATE MAINTENANCE TASKS:
- Include ALL tasks that matter for safety, longevity, and performance
- Include tasks regardless of whether they require a professional
- Rank by priority: safety-critical first, then damage prevention, then performance, then cosmetic
- For each task, include a purchasable product with specific part numbers and dimensions when one exists. If the task has no associated product, omit the products array
- Use your full knowledge of this specific brand and model to determine exact part numbers, dimensions, and specifications

PRIORITY LEVELS:
- critical: Safety risk if neglected (fire hazard, gas leak, electrical, flooding, structural failure, health hazard)
- high: Will cause expensive damage or premature failure if neglected
- medium: Affects performance, efficiency, or user experience
- low: Cosmetic, convenience, or minor optimization

DIFFICULTY:
- easy: No tools or expertise needed
- moderate: Basic tools and some know-how
- hard: Significant effort, specialized tools, or expertise — many people hire this out
- professional-only: Requires licensed or certified technician

SERVICE OPTION: Set serviceOption to true unless the task is trivially simple (wiping a surface, pressing a reset button). Most tasks should be true — even easy tasks like filter replacement, because some people prefer to hire everything out.

Return ONLY valid JSON (no markdown, no backticks):
{
  "item": "Specific identification with brand, model, and key specs",
  "brand": "Brand or null",
  "model": "Model number/name or null",
  "category": "appliance/vehicle/outdoor/plumbing/electrical/hvac/structure/furniture/electronics/tool/sporting/fitness/pet/personal-care/hobby/other",
  "condition": "Visible condition assessment or null",
  "confidence": "high/medium/low",
  "maintenanceSchedule": [
    {
      "task": "Specific maintenance task name",
      "interval": "How often (e.g., Every 3 months, Every 5,000 miles, Annually)",
      "priority": "critical/high/medium/low",
      "difficulty": "easy/moderate/hard/professional-only",
      "serviceOption": true,
      "estimatedCost": "$XX-$XX",
      "description": "Why this matters and what specifically to do. Include exact specs.",
      "products": [
        {
          "name": "Product WITH exact spec (e.g., '20x20x1 MERV 11 Air Filter')",
          "amazonQuery": "specific search with dimensions/part numbers — NEVER generic"
        }
      ]
    }
  ],
  "tips": ["Specific pro tips for THIS exact product"],
  "lifespanEstimate": "Expected lifespan with proper maintenance"
}

SELF-CHECK: Review every amazonQuery. Does each one contain a specific dimension, part number, or model-specific spec? If any query is generic, rewrite it with the exact specification.`;

function getActivePrompt() {
  try {
    if (existsSync(PROMPTS_PATH)) {
      const data = JSON.parse(readFileSync(PROMPTS_PATH, "utf-8"));
      if (data.activeVersion && data.versions) {
        const active = data.versions.find(v => v.version === data.activeVersion);
        if (active?.content) return active.content;
      }
    }
  } catch {}
  return DEFAULT_PROMPT;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, mediaType, model: requestedModel, apiKeys } = req.body;
  if (!image) return res.status(400).json({ error: "No image provided" });

  const selectedModel = requestedModel || "claude-sonnet-4-20250514";

  function getProvider(m) {
    if (m.includes("claude")) return "anthropic";
    if (m.includes("gpt")) return "openai";
    if (m.includes("gemini")) return "gemini";
    return "anthropic";
  }

  const provider = getProvider(selectedModel);

  function resolveKey(prov) {
    const overrides = apiKeys || {};
    const envMap = { anthropic: "ANTHROPIC_API_KEY", openai: "OPENAI_API_KEY", gemini: "GEMINI_API_KEY" };
    return overrides[prov] || process.env[envMap[prov]] || null;
  }

  const apiKey = resolveKey(provider);
  if (!apiKey) return res.status(500).json({ error: `No API key for ${provider}. Set the environment variable or provide in request.` });

  const prompt = getActivePrompt();
  const startTime = Date.now();

  try {
    let response, text, inputTokens = 0, outputTokens = 0;

    if (provider === "anthropic") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 3000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
              { type: "text", text: prompt },
            ],
          }],
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: "API error: " + errText.slice(0, 300) });
      }
      const data = await response.json();
      text = data.content.map(c => c.type === "text" ? c.text : "").join("").trim();
      inputTokens = data.usage?.input_tokens || 0;
      outputTokens = data.usage?.output_tokens || 0;

    } else if (provider === "openai") {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 3000,
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
              { type: "text", text: prompt },
            ],
          }],
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: "API error: " + errText.slice(0, 300) });
      }
      const data = await response.json();
      text = data.choices[0].message.content;
      inputTokens = data.usage?.prompt_tokens || 0;
      outputTokens = data.usage?.completion_tokens || 0;

    } else if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType || "image/jpeg", data: image } },
              { text: prompt },
            ],
          }],
          generationConfig: { maxOutputTokens: 3000 },
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: "API error: " + errText.slice(0, 300) });
      }
      const data = await response.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      inputTokens = data.usageMetadata?.promptTokenCount || 0;
      outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
    }

    const elapsed = Date.now() - startTime;
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    try {
      const parsed = JSON.parse(clean);
      parsed._meta = { model: selectedModel, provider, elapsed, inputTokens, outputTokens };
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(200).json({ raw: clean, error: "Could not parse structured response", _meta: { model: selectedModel, provider, elapsed } });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
