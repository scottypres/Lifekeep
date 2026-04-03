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
              text: `You are an expert HVAC technician. Analyze this photo of an HVAC unit, furnace, or air handler.

STEP 1 — READ EVERYTHING:
Transcribe every piece of text visible: manufacturer, model number, serial number, voltage, amps, BTU rating, all of it. The label may be in English or Spanish.

STEP 2 — IDENTIFY THE EXACT UNIT:
From the model number, use your knowledge of HVAC product lines to identify:
- The manufacturer and product series
- The tonnage/BTU capacity
- The cabinet configuration and width
- Any other relevant specifications

STEP 3 — DETERMINE THE EXACT FILTER SIZE:
This is your most important job. You must determine the exact air filter dimensions (e.g., 20x20x1, 16x25x4).

USE YOUR TRAINING KNOWLEDGE. You know what filters specific HVAC models use. For example:
- Rheem RH1PZ series: the model number encodes tonnage and cabinet width. RH1PZ4821 = 4-ton, 21" cabinet = uses 20x20x1 filter.
- Carrier/Bryant: model numbers often encode filter rack dimensions.
- Trane/American Standard: look up the specific model's specifications.
- Goodman/Amana: cabinet width determines filter size.

Do NOT guess randomly. Cross-reference the specific model number with your knowledge of that product line's specifications. If you know what filter a Rheem RH1PZ4821 takes, say so with high confidence.

If you truly cannot determine the size, explain what additional information would help (e.g., "measure the filter slot opening" or "check the existing filter").

STEP 4 — GENERATE SPECIFIC SEARCH QUERIES:
Every search query MUST include the exact filter dimensions. Example: "20x20x1 air filter MERV 11 pleated" — NEVER "Rheem air filter replacement".

Return ONLY valid JSON (no markdown, no backticks):
{
  "manufacturer": "Brand name",
  "modelNumber": "Exact model number from label",
  "serialNumber": "Serial if visible, or null",
  "unitType": "e.g., Air Handler, Furnace, Heat Pump, Package Unit",
  "tonnage": "e.g., 4-ton / 48,000 BTU",
  "filterSize": "EXACT dimensions like 20x20x1 — be specific and confident",
  "filterType": "Recommended MERV rating",
  "howDetermined": "Explain exactly how you determined the filter size — what in the model number or your knowledge told you this",
  "rawText": "ALL text transcribed from the image",
  "confidence": "high/medium/low",
  "notes": "Maintenance advice specific to this unit",
  "amazonSearches": [
    { "label": "Standard Filter (exact size)", "query": "[exact dimensions] air filter MERV 8 pleated" },
    { "label": "Better Filter (exact size)", "query": "[exact dimensions] air filter MERV 11 pleated" },
    { "label": "Premium Filter (exact size)", "query": "[exact dimensions] air filter MERV 13 Filtrete" },
    { "label": "Multi-Pack Value (exact size)", "query": "[exact dimensions] air filter 6 pack" }
  ]
}

Every amazonSearch query MUST start with the exact filter dimensions. No exceptions.`
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
