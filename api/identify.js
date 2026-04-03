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

  const HAIKU = "claude-haiku-4-5-20251001";
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  try {
    // ─── STEP 1: Haiku Vision — fast OCR and identification ───
    const step1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: HAIKU,
        max_tokens: 800,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: image },
            },
            {
              type: "text",
              text: `Identify this item. Return ONLY JSON (no markdown/backticks):
{"item":"specific item name","brand":"brand or null","model":"model or null","category":"appliance/vehicle/outdoor/plumbing/electrical/hvac/structure/furniture/electronics/tool/sporting/other","allVisibleText":"every piece of text visible on labels/plates/stickers","condition":"brief condition note or null","confidence":"high/medium/low"}`
            }
          ],
        }],
      }),
    });

    if (!step1.ok) {
      const errText = await step1.text();
      return res.status(step1.status).json({ error: `Vision step failed: ${errText.slice(0, 300)}` });
    }

    const step1Data = await step1.json();
    const step1Text = step1Data.content.map(c => c.type === "text" ? c.text : "").join("").trim();
    const step1Clean = step1Text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let identification;
    try {
      identification = JSON.parse(step1Clean);
    } catch (e) {
      return res.status(200).json({ raw: step1Clean, error: "Could not parse identification" });
    }

    // ─── STEP 2: Haiku Text — build maintenance schedule from identification ───
    const step2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: HAIKU,
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `You are a maintenance expert. Based on this identified item, create a complete maintenance schedule.

Item: ${identification.item}
Brand: ${identification.brand || "Unknown"}
Model: ${identification.model || "Unknown"}
Category: ${identification.category}
Label text found: ${identification.allVisibleText || "None"}

Return ONLY valid JSON (no markdown, no backticks):
{
  "item": "${identification.item}",
  "brand": ${JSON.stringify(identification.brand)},
  "model": ${JSON.stringify(identification.model)},
  "category": "${identification.category}",
  "condition": ${JSON.stringify(identification.condition)},
  "confidence": "${identification.confidence}",
  "maintenanceSchedule": [
    {
      "task": "Task name",
      "interval": "How often",
      "priority": "high/medium/low",
      "difficulty": "diy/professional",
      "estimatedCost": "$XX-$XX",
      "description": "Why this matters",
      "products": [
        { "name": "Product name", "amazonQuery": "specific amazon search for this product for this exact item" }
      ]
    }
  ],
  "tips": ["pro tips for this item"],
  "lifespanEstimate": "expected lifespan"
}

Be thorough. Include every maintenance task from routine cleaning to major service. Be specific with product recommendations — include sizes, types, specs when the brand/model is known. Tailor amazon queries to the specific brand and model when identified.`
        }],
      }),
    });

    if (!step2.ok) {
      const errText = await step2.text();
      return res.status(step2.status).json({ error: `Schedule step failed: ${errText.slice(0, 300)}` });
    }

    const step2Data = await step2.json();
    const step2Text = step2Data.content.map(c => c.type === "text" ? c.text : "").join("").trim();
    const step2Clean = step2Text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    try {
      return res.status(200).json(JSON.parse(step2Clean));
    } catch (parseErr) {
      return res.status(200).json({ raw: step2Clean, error: "Could not parse schedule response" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
