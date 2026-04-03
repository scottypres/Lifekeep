export default async function handler(req, res) {
  // CORS headers
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `Analyze this HVAC unit, air handler, or furnace label photo. Extract all useful information and determine the correct replacement air filter size and any other replacement parts.

Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "manufacturer": "Brand name",
  "modelNumber": "Full model number",
  "serialNumber": "Serial number if visible, or null",
  "filterSize": "Filter dimensions like 20x25x1, or null if not determinable",
  "filterType": "MERV rating or type if visible, or recommended default like MERV 8-11",
  "additionalParts": ["any other identifiable replacement parts"],
  "rawText": "All text visible on the label",
  "confidence": "high/medium/low",
  "notes": "Any helpful context about this unit or its maintenance needs",
  "amazonSearches": [
    { "label": "Replacement Air Filter", "query": "specific amazon search query for the exact filter" },
    { "label": "Additional part name", "query": "specific amazon search query" }
  ]
}

If the image is not an HVAC label, set confidence to "low" and do your best to identify what it is and what parts it might need. Always provide amazonSearches with at least one entry.`
            }
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Claude API error: ${errText.slice(0, 300)}` });
    }

    const data = await response.json();
    const text = data.content.map(c => c.type === "text" ? c.text : "").join("").trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    try {
      const parsed = JSON.parse(clean);
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(200).json({ raw: clean, error: "Could not parse structured response" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
