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
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: image },
            },
            {
              type: "text",
              text: "You are a maintenance expert. Look at this photo and:\n\n1. Identify what the item/product is (be as specific as possible — brand, model, type, age estimate if visible)\n2. Determine ALL recurring maintenance tasks this item needs\n3. For each maintenance task, suggest the specific products or supplies needed with Amazon search queries\n\nReturn ONLY valid JSON (no markdown, no backticks, no preamble):\n{\"item\":\"What this item is (be specific)\",\"brand\":\"Brand if identifiable, or null\",\"model\":\"Model if identifiable, or null\",\"category\":\"One of: appliance, vehicle, outdoor, plumbing, electrical, hvac, structure, furniture, electronics, tool, sporting, other\",\"condition\":\"Brief assessment of visible condition if relevant\",\"confidence\":\"high/medium/low\",\"maintenanceSchedule\":[{\"task\":\"Name of maintenance task\",\"interval\":\"How often (e.g. Every 3 months, Annually, Every 25 hours of use)\",\"priority\":\"high/medium/low\",\"difficulty\":\"diy/professional\",\"estimatedCost\":\"$XX-$XX range\",\"description\":\"Brief explanation of why this matters and what happens if skipped\",\"products\":[{\"name\":\"Specific product needed\",\"amazonQuery\":\"specific amazon search query to find this product\"}]}],\"tips\":[\"1-3 pro tips specific to maintaining this item\"],\"lifespanEstimate\":\"Expected lifespan with proper maintenance\"}\n\nBe thorough. Include every maintenance task from routine cleaning to major service intervals. Be specific with product recommendations including sizes, types, and specifications when identifiable. If you can identify the exact brand/model, tailor everything to that specific unit."
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
