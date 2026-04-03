// LLM Comparison Tester — Prompt Configuration
// Each step has a default prompt and optional per-model overrides (null = use default)

export const MODELS = [
  { id: "claude-sonnet-4-20250514", provider: "Anthropic", label: "Claude Sonnet 4", vision: true },
  { id: "claude-haiku-4-5-20251001", provider: "Anthropic", label: "Claude Haiku 4.5", vision: true },
  { id: "gpt-4o", provider: "OpenAI", label: "GPT-4o", vision: true },
  { id: "gpt-4o-mini", provider: "OpenAI", label: "GPT-4o Mini", vision: true },
  { id: "gemini-2.5-flash", provider: "Google", label: "Gemini 2.5 Flash", vision: true },
  { id: "gemini-2.5-pro", provider: "Google", label: "Gemini 2.5 Pro", vision: true },
];

// Cost per million tokens [input, output]
export const PRICING = {
  "claude-sonnet-4-20250514": [3.00, 15.00],
  "claude-haiku-4-5-20251001": [1.00, 5.00],
  "gpt-4o": [2.50, 10.00],
  "gpt-4o-mini": [0.15, 0.60],
  "gemini-2.5-flash": [0.15, 0.60],
  "gemini-2.5-pro": [1.25, 10.00],
};

export const STEP_LABELS = {
  1: "OCR — Text Extraction",
  2: "Product Identification",
  3: "Parts Specification",
  4: "Maintenance Schedule",
  5: "Search Query Generation",
};

export const PROMPTS = {
  step1_ocr: {
    default: `You are an expert OCR system. Transcribe ALL text visible in this image exactly as written. Include text from labels, nameplates, stickers, serial number plates, model tags, warning labels, and any other visible text. Preserve line breaks where they appear on the original label. Be thorough — missing even one character from a model number makes it useless.

Return ONLY valid JSON (no markdown, no backticks):
{
  "ocrText": "all transcribed text here, preserving line structure with newlines"
}`,
    "claude-sonnet-4-20250514": null,
    "claude-haiku-4-5-20251001": null,
    "gpt-4o": null,
    "gpt-4o-mini": null,
    "gemini-2.5-flash": null,
    "gemini-2.5-pro": null,
  },

  step2_identify: {
    default: `You are a product identification expert. Given the following text extracted from a product label via OCR, identify the exact product.

OCR TEXT:
{ocrText}

Use your training knowledge to determine the exact brand, model number, product type, category, and any variant or configuration details. If the text contains a model number, look up what product that model number corresponds to.

Return ONLY valid JSON (no markdown, no backticks):
{
  "item": "Full product name with brand, model, and key specifications",
  "brand": "Brand name or null",
  "model": "Exact model number/name or null",
  "category": "appliance/vehicle/outdoor/plumbing/electrical/hvac/structure/furniture/electronics/tool/sporting/fitness/pet/personal-care/hobby/other",
  "confidence": "high/medium/low",
  "notes": "Any relevant details about variant, configuration, or generation"
}`,
    "claude-sonnet-4-20250514": null,
    "claude-haiku-4-5-20251001": null,
    "gpt-4o": null,
    "gpt-4o-mini": null,
    "gemini-2.5-flash": null,
    "gemini-2.5-pro": null,
  },

  step3_parts: {
    default: `You are a parts and specifications expert. Given the following identified product, use your training knowledge to determine the EXACT replacement parts, consumables, and maintenance supplies needed for this specific product.

IDENTIFIED PRODUCT:
{identifiedProduct}

This is the MOST IMPORTANT step. You must provide specific dimensions, part numbers, fluid types, filter sizes — not generic descriptions. For example:
- "20x20x1 MERV 11 air filter" NOT "replacement air filter"
- "5W-30 full synthetic motor oil" NOT "motor oil"
- "Part #W10295370A water filter" NOT "refrigerator water filter"

Return ONLY valid JSON (no markdown, no backticks):
{
  "parts": [
    {
      "name": "Descriptive name with exact specs included",
      "partNumber": "OEM part number if known, or null",
      "dimensions": "Physical dimensions if applicable, or null",
      "spec": "Key specification (capacity, rating, type, viscosity, etc.)"
    }
  ]
}`,
    "claude-sonnet-4-20250514": null,
    "claude-haiku-4-5-20251001": null,
    "gpt-4o": null,
    "gpt-4o-mini": null,
    "gemini-2.5-flash": null,
    "gemini-2.5-pro": null,
  },

  step4_schedule: {
    default: `You are a maintenance planning expert. Given the following product and its replacement parts, create a complete maintenance schedule.

PRODUCT:
{identifiedProduct}

PARTS:
{partsSpec}

Include ALL tasks that matter for safety, longevity, and performance. Rank by priority. Include tasks regardless of whether they require a professional.

Return ONLY valid JSON (no markdown, no backticks):
{
  "schedule": [
    {
      "task": "Specific maintenance task name",
      "interval": "How often (e.g., Every 3 months, Every 5,000 miles, Annually)",
      "priority": "critical/high/medium/low",
      "difficulty": "easy/moderate/hard/professional-only",
      "estimatedCost": "$XX-$XX",
      "description": "Why this matters and what specifically to do. Include exact specs."
    }
  ]
}`,
    "claude-sonnet-4-20250514": null,
    "claude-haiku-4-5-20251001": null,
    "gpt-4o": null,
    "gpt-4o-mini": null,
    "gemini-2.5-flash": null,
    "gemini-2.5-pro": null,
  },

  step5_queries: {
    default: `You are a product search expert. Given these maintenance parts with their specifications, generate highly specific Amazon and Google Shopping search queries.

PARTS:
{partsSpec}

Every query MUST contain exact dimensions, part numbers, or model-specific specifications. Never generate generic queries. A good query returns the exact right product as the first result.

Examples of GOOD queries:
- "20x20x1 MERV 11 air filter 6-pack"
- "Rheem!"

Examples of BAD queries:
- "HVAC air filter"
- "replacement filter"

Return ONLY valid JSON (no markdown, no backticks):
{
  "queries": [
    {
      "partName": "Name of the part",
      "amazonQuery": "specific Amazon search query with exact specs",
      "googleQuery": "specific Google Shopping search query with exact specs"
    }
  ]
}`,
    "claude-sonnet-4-20250514": null,
    "claude-haiku-4-5-20251001": null,
    "gpt-4o": null,
    "gpt-4o-mini": null,
    "gemini-2.5-flash": null,
    "gemini-2.5-pro": null,
  },
};

export function getPrompt(step, modelId, context = {}) {
  const stepKey = `step${step}_${["", "ocr", "identify", "parts", "schedule", "queries"][step]}`;
  const stepPrompts = PROMPTS[stepKey];
  if (!stepPrompts) return "";

  let prompt = stepPrompts[modelId] || stepPrompts.default;

  // Replace context placeholders
  if (context.ocrText) prompt = prompt.replace("{ocrText}", context.ocrText);
  if (context.identifiedProduct) prompt = prompt.replace("{identifiedProduct}", context.identifiedProduct);
  if (context.partsSpec) prompt = prompt.replace("{partsSpec}", context.partsSpec);
  if (context.schedule) prompt = prompt.replace("{schedule}", context.schedule);

  return prompt;
}
