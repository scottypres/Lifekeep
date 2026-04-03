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
              text: `You are an expert HVAC technician analyzing a photo of an HVAC unit, furnace, air handler, or its label/nameplate.

YOUR #1 JOB: Determine the EXACT replacement air filter size this unit needs.

Step-by-step process:
1. Read EVERY piece of text visible in the image — model numbers, serial numbers, specs, dimensions, ratings, everything.
2. From the model number and visible specs, determine the EXACT filter size (e.g., 20x20x1, 16x25x4, 20x25x1). Many model numbers encode the filter size. For example, a model containing "020020" likely means 20x20. Look for any dimensions printed on the unit or label.
3. If you can see the filter slot or the unit dimensions, use those to determine filter size.
4. If you cannot determine exact size from the image, state what you DO know and recommend the most likely size based on the unit type and model.

CRITICAL RULES FOR SEARCH QUERIES:
- ALWAYS include the exact filter dimensions in search queries (e.g., "20x20x1 air filter MERV 11" NOT just "air filter for Carrier")
- ALWAYS include specific part numbers, sizes, or specifications in every search query
- NEVER generate a vague search like "replacement filter for [brand]" — always include the SIZE or PART NUMBER
- For additional parts, include exact specifications (e.g., "3/4 inch x 6ft foam weatherstrip" not just "weatherstrip")

Return ONLY valid JSON (no markdown, no backticks):
{
  "manufacturer": "Brand name",
  "modelNumber": "Full model number exactly as shown",
  "serialNumber": "Serial number if visible, or null",
  "filterSize": "Exact dimensions like 20x20x1 — this is the most important field",
  "filterType": "Recommended MERV rating (e.g., MERV 8, MERV 11, MERV 13)",
  "additionalParts": ["list of other replacement parts this unit may need"],
  "rawText": "ALL text you can read from the image, transcribed exactly",
  "confidence": "high/medium/low",
  "notes": "How you determined the filter size, plus any maintenance advice",
  "amazonSearches": [
    { "label": "Replacement Air Filter (exact size)", "query": "20x20x1 air filter MERV 11 pleated" },
    { "label": "Premium Air Filter", "query": "20x20x1 MERV 13 air filter Filtrete" },
    { "label": "Budget Multi-Pack", "query": "20x20x1 air filter 6 pack MERV 8" }
  ]
}

The amazonSearches MUST include the exact filter dimensions in every query. Include at least 3 filter options at different MERV ratings/price points. Add any other parts the unit needs (UV bulbs, condensate pan tablets, etc.) with specific sizes.`
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
