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
              text: `You are a world-class product maintenance expert. Analyze this photo to identify the item and build a complete maintenance plan with EXACT part specifications.

STEP 1 — READ AND IDENTIFY:
- Read ALL visible text: model numbers, serial numbers, specs, labels, stickers, dimensions, ratings, in any language
- Identify the exact brand, model, product line, year/generation
- Note the specific variant, size, capacity, or configuration

STEP 2 — USE YOUR KNOWLEDGE TO LOOK UP SPECS:
This is critical. Once you have the brand and model, USE YOUR TRAINING KNOWLEDGE to look up what specific parts this product uses. You have extensive knowledge of product specifications from your training data. Use it.

For example:
- If you see a Rheem RH1PZ4821 air handler, you KNOW it uses a 20x20x1 filter
- If you see a Honda HRX217, you KNOW it uses a GXV200 engine with 10W-30 oil and an NGK BPR6ES spark plug
- If you see a Dyson V15, you KNOW exactly which filter cartridge it needs
- If you see a specific car model, you KNOW the oil weight, filter part numbers, and service intervals

Do NOT guess or generate generic recommendations when you have specific knowledge.

STEP 3 — BUILD MAINTENANCE SCHEDULE:
For every maintenance task, determine the exact products needed with SPECIFIC dimensions, part numbers, and specifications.

MANDATORY RULES FOR SEARCH QUERIES:
Every amazonQuery MUST include exact specifications. Examples:
- GOOD: "20x20x1 MERV 11 pleated air filter" 
- BAD: "air filter for Rheem"
- GOOD: "Honda GCV170 spark plug NGK BPR6ES"
- BAD: "lawn mower spark plug"
- GOOD: "Whirlpool W10295370A refrigerator water filter"
- BAD: "fridge water filter Whirlpool"
- GOOD: "SAE 10W-30 4-cycle small engine oil 20oz Briggs Stratton"
- BAD: "small engine oil"
- GOOD: "21 inch mulching blade for Honda HRX217 mower"
- BAD: "lawn mower blade replacement"
- GOOD: "Intex Type A pool filter cartridge 29000E 2 pack"
- BAD: "pool filter cartridge"

The pattern: dimensions OR part numbers OR model-specific identifiers in EVERY query.

Return ONLY valid JSON (no markdown, no backticks):
{
  "item": "Specific identification with brand, model, and key specs",
  "brand": "Brand or null",
  "model": "Model number/name or null",
  "category": "appliance/vehicle/outdoor/plumbing/electrical/hvac/structure/furniture/electronics/tool/sporting/other",
  "condition": "Visible condition assessment or null",
  "confidence": "high/medium/low",
  "maintenanceSchedule": [
    {
      "task": "Specific maintenance task",
      "interval": "How often",
      "priority": "high/medium/low",
      "difficulty": "diy/professional",
      "estimatedCost": "$XX-$XX",
      "description": "Why this matters. Include the exact spec/size/part number needed.",
      "products": [
        {
          "name": "Product with exact specification (e.g., '20x20x1 MERV 11 Air Filter')",
          "amazonQuery": "query with exact dimensions/part numbers/specs — NEVER generic"
        }
      ]
    }
  ],
  "tips": ["Specific pro tips for THIS exact product"],
  "lifespanEstimate": "Expected lifespan with proper maintenance"
}

FINAL SELF-CHECK: Before responding, review every amazonQuery. Each one must contain a specific dimension, part number, or model-specific identifier. Rewrite any generic query to include exact specs.`
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
