import { readFileSync, writeFileSync, existsSync } from "fs";

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

function readPrompts() {
  try {
    if (existsSync(PROMPTS_PATH)) {
      return JSON.parse(readFileSync(PROMPTS_PATH, "utf-8"));
    }
  } catch {}
  // Seed with default prompt so the editor always has something to show
  const seeded = {
    activeVersion: 1,
    versions: [{
      version: 1,
      content: DEFAULT_PROMPT,
      notes: "Default system prompt",
      createdAt: new Date().toISOString(),
      source: "system",
    }],
  };
  try { writePrompts(seeded); } catch {}
  return seeded;
}

function writePrompts(data) {
  writeFileSync(PROMPTS_PATH, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — return prompt versions
  if (req.method === "GET") {
    const data = readPrompts();
    const version = req.query.version;

    if (version) {
      const v = data.versions.find(v => v.version === parseInt(version));
      if (!v) return res.status(404).json({ error: "Version not found" });
      return res.status(200).json(v);
    }

    return res.status(200).json(data);
  }

  // POST — save new prompt version
  if (req.method === "POST") {
    try {
      const { content, notes, source } = req.body;
      if (!content) return res.status(400).json({ error: "Prompt content required" });

      const data = readPrompts();
      const nextVersion = data.versions.length > 0
        ? Math.max(...data.versions.map(v => v.version)) + 1
        : 1;

      const newVersion = {
        version: nextVersion,
        content,
        notes: notes || "",
        createdAt: new Date().toISOString(),
        source: source || "manual",
      };

      data.versions.push(newVersion);
      data.activeVersion = nextVersion;
      writePrompts(data);

      return res.status(200).json({ success: true, version: nextVersion, total: data.versions.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT — set active version
  if (req.method === "PUT") {
    try {
      const { activeVersion } = req.body;
      if (activeVersion == null) return res.status(400).json({ error: "activeVersion required" });

      const data = readPrompts();
      const exists = data.versions.find(v => v.version === parseInt(activeVersion));
      if (!exists) return res.status(404).json({ error: "Version not found" });

      data.activeVersion = parseInt(activeVersion);
      writePrompts(data);

      return res.status(200).json({ success: true, activeVersion: data.activeVersion });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
