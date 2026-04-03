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
              text: `You are a world-class product maintenance expert. Analyze this photo, identify the item, and build a complete maintenance plan with EXACT replacement part specifications.

STEP 1 — READ AND IDENTIFY:
Read ALL visible text in any language. Identify the exact brand, model, product line, and variant.

STEP 2 — USE YOUR TRAINING KNOWLEDGE TO LOOK UP EXACT SPECS:
Once you identify the product, you MUST use your training knowledge to determine the EXACT replacement parts, fluids, filters, and consumables it uses. You have seen spec sheets, owner's manuals, parts catalogs, and forum posts for millions of products. Use that knowledge.

Here is how this works for EVERY product category:

HVAC / FURNACES / AIR HANDLERS:
- Decode model numbers to determine cabinet width and filter size
- Rheem RH1PZ4821 = 4-ton, 21" cabinet = 20x20x1 filter
- Carrier 59TP6 series: look up the specific filter rack dimensions
- Know the difference between 1", 4", and 5" deep filter systems
- Include specific MERV ratings in searches: "20x20x1 MERV 11 pleated air filter"

LAWN MOWERS / OUTDOOR POWER:
- From the model, determine engine type (e.g., Honda GCV170, Briggs 725EXi)
- Look up exact oil type and capacity (e.g., SAE 10W-30, 20oz)
- Look up exact spark plug (e.g., NGK BPR6ES, Champion RJ19LM)
- Look up exact blade size and center hole (e.g., "21 inch mower blade 7/8 center hole")
- Look up exact air filter part number (e.g., "Honda 17211-ZL8-023 air filter")
- Search: "Honda GCV170 spark plug NGK BPR6ES" NOT "lawn mower spark plug"

VEHICLES / CARS / TRUCKS:
- From year/make/model, look up exact oil weight (e.g., 0W-20 full synthetic)
- Look up OEM and aftermarket filter part numbers (e.g., "Fram PH7317 oil filter")
- Look up exact tire size from door sticker (e.g., "235/65R17 all season tire")
- Look up exact battery group size (e.g., "Group 51R battery AGM")
- Look up cabin and engine air filter part numbers
- Search: "2022 Honda CR-V cabin air filter" NOT "car cabin filter"

KITCHEN APPLIANCES:
- Refrigerator: look up exact water filter model (e.g., "Whirlpool W10295370A", "Samsung DA29-00020B")
- Dishwasher: determine specific rack wheel part numbers, spray arm specs
- Oven: determine specific gasket dimensions, igniter part numbers
- Search: "Samsung DA29-00020B refrigerator water filter 3 pack" NOT "Samsung fridge filter"

WATER HEATERS:
- From model, determine anode rod type and length (e.g., "3/4 inch NPT x 44 inch magnesium anode rod")
- Determine element wattage for electric units (e.g., "4500W 240V water heater element Camco")
- Determine T&P valve specs (e.g., "3/4 inch 150 PSI temperature pressure relief valve")
- Search: "Rheem SP20060 anode rod 44 inch magnesium" NOT "water heater anode rod"

POOL / SPA EQUIPMENT:
- From pump model, determine exact filter cartridge (e.g., "Intex Type A 29000E", "Pleatco PA120 for Hayward")
- Know chemical types and test kit specs
- Search: "Pleatco PA120 pool filter cartridge Hayward C1200" NOT "pool filter"

POWER TOOLS:
- From model, determine blade/bit/disc specs (e.g., "7-1/4 inch 24T carbide circular saw blade 5/8 arbor")
- Determine brush size, belt number, or specific consumable
- Search: "DeWalt DW3578B3 7-1/4 framing blade 24T" NOT "circular saw blade"

BICYCLES:
- Determine tire size from sidewall (e.g., "700x25c road tire", "26x2.1 mountain tire")
- Determine chain spec (e.g., "KMC X11 11-speed chain 116 links")
- Determine brake pad compound and mount type (e.g., "Shimano B01S resin disc brake pads")
- Search: "Continental Grand Prix 5000 700x25c road tire" NOT "bike tire"

ELECTRONICS:
- Determine battery type (e.g., "CR2032 lithium coin cell", "18650 3500mAh protected")
- Determine specific filter/consumable part numbers
- Search: "iRobot Roomba i7 side brush 3 pack 4634648" NOT "robot vacuum brush"

PLUMBING:
- Determine cartridge model for faucets (e.g., "Moen 1222 cartridge Posi-Temp")
- Determine flapper/fill valve specs for toilets (e.g., "Korky 2 inch universal flapper 2021BP")
- Search: "Moen 1222 replacement cartridge single handle" NOT "faucet cartridge"

The pattern across ALL categories: use the brand and model to determine EXACT part numbers, dimensions, and specifications. Then put those specs in the search queries.

STEP 3 — BUILD MAINTENANCE SCHEDULE:
For each task, include specific interval, cost estimate, DIY vs professional, and the exact products with specification-rich search queries.

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
      "description": "Why this matters. Include the exact spec/size/part number the user needs to know.",
      "products": [
        {
          "name": "Product WITH exact spec (e.g., '20x20x1 MERV 11 Air Filter' or 'NGK BPR6ES Spark Plug')",
          "amazonQuery": "query with exact dimensions/part numbers — NEVER generic"
        }
      ]
    }
  ],
  "tips": ["Specific pro tips for THIS exact product — not generic advice"],
  "lifespanEstimate": "Expected lifespan with proper maintenance",
  "allVisibleText": "Transcribe ALL text visible in the image — every label, sticker, model number, serial number, spec plate, exactly as written",
  "howDetermined": "Explain step-by-step how you identified this product and determined the specific parts it needs"
}

FINAL SELF-CHECK: Review every amazonQuery. Does each one contain a specific dimension, part number, or model-specific spec? If ANY query says just "replacement [part] for [brand]" without a size or part number, REWRITE IT with the exact specification.`
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
