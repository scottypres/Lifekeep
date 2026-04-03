export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ error: "No image provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in Vercel environment variables" });

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
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: image },
            },
            {
              type: "text",
              text: `You are a world-class maintenance expert and product specialist. Analyze this photo to identify the item and create a thorough maintenance plan.

STEP 1 — IDENTIFY WITH MAXIMUM SPECIFICITY:
- Read ALL visible text: model numbers, serial numbers, specs, labels, stickers, dimensions, ratings
- Identify exact brand, model, year/generation if possible
- Note the specific variant, size, capacity, or configuration

STEP 2 — DETERMINE EVERY MAINTENANCE TASK:
- Think through what this specific item needs to stay in top condition
- Consider manufacturer-recommended service intervals
- Include both routine maintenance AND periodic deep maintenance
- Think about consumable parts, wear items, cleaning, lubrication, calibration, seasonal prep

STEP 3 — DETERMINE EXACT SPECIFICATIONS FOR EVERY PART:
This is the most critical step. For every product recommendation, you MUST determine the EXACT specification:

Examples of GOOD vs BAD search queries:
- GOOD: "20x20x1 MERV 11 pleated air filter" — BAD: "air filter for Carrier furnace"
- GOOD: "Honda GCV170 16 inch mower blade" — BAD: "lawn mower blade"  
- GOOD: "SAE 10W-30 small engine oil 20oz" — BAD: "lawn mower oil"
- GOOD: "BG-55 spark plug Bosch WSR6F" — BAD: "leaf blower spark plug"
- GOOD: "6ft 3/16 inch fuel line small engine" — BAD: "fuel line replacement"
- GOOD: "Whirlpool W10295370A refrigerator water filter" — BAD: "fridge water filter"
- GOOD: "Type A pool pump filter cartridge Intex 29000E" — BAD: "pool filter"
- GOOD: "3M 2097 P100 filter cartridge for respirator" — BAD: "respirator filter"

The rule: EVERY search query must include dimensions, part numbers, exact sizes, model-specific identifiers, or precise specifications. NEVER generate a generic search.

If you can identify the brand and model, cross-reference what specific parts it uses. If you can see a model number, use your knowledge of that product line to determine exact compatible parts.

Return ONLY valid JSON (no markdown, no backticks, no preamble):
{
  "item": "Specific item identification (brand, model, type, size/capacity)",
  "brand": "Brand or null",
  "model": "Model number/name or null",
  "category": "appliance/vehicle/outdoor/plumbing/electrical/hvac/structure/furniture/electronics/tool/sporting/other",
  "condition": "Visible condition assessment or null",
  "confidence": "high/medium/low",
  "maintenanceSchedule": [
    {
      "task": "Specific maintenance task name",
      "interval": "How often (e.g., Every 3 months, Every 25 hours, Annually, Every 50 uses)",
      "priority": "high/medium/low",
      "difficulty": "diy/professional",
      "estimatedCost": "$XX-$XX",
      "description": "Why this matters and what happens if neglected. Include the specific spec or size needed.",
      "products": [
        {
          "name": "Exact product with specification (e.g., '20x20x1 MERV 11 Air Filter' not just 'Air Filter')",
          "amazonQuery": "highly specific search query with exact dimensions/part numbers/specs"
        }
      ]
    }
  ],
  "tips": ["Specific pro tips for THIS exact item, not generic advice"],
  "lifespanEstimate": "Expected lifespan with proper maintenance"
}

FINAL CHECK before responding: Review every single amazonQuery. Does it contain specific dimensions, part numbers, or model-specific identifiers? If any query is generic like "replacement filter for [brand]", rewrite it with the actual size or part number. Every query should work as a standalone search that returns the exact right product.`
            }
          ],
        }],
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
    } catch (parseErr) {
      return res.status(200).json({ raw: clean, error: "Could not parse structured response" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
