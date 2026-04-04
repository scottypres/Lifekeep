// LLM Comparison Tester — Serverless Endpoint
// Handles one step for one model at a time. Frontend orchestrates parallel calls.

const PRICING = {
  "claude-sonnet-4-20250514": [3.00, 15.00],
  "claude-haiku-4-5-20251001": [1.00, 5.00],
  "gpt-4o": [2.50, 10.00],
  "gpt-4o-mini": [0.15, 0.60],
  "gemini-2.5-flash": [0.15, 0.60],
  "gemini-2.5-pro": [1.25, 10.00],
};

function getProvider(model) {
  if (model.includes("claude")) return "Anthropic";
  if (model.includes("gpt")) return "OpenAI";
  if (model.includes("gemini")) return "Google";
  return null;
}

function getApiKey(provider, apiKeys = {}) {
  const overrides = {
    Anthropic: apiKeys.anthropic,
    OpenAI: apiKeys.openai,
    Google: apiKeys.gemini,
  };
  const envKeys = {
    Anthropic: process.env.ANTHROPIC_API_KEY,
    OpenAI: process.env.OPENAI_API_KEY,
    Google: process.env.GEMINI_API_KEY,
  };
  return overrides[provider] || envKeys[provider] || null;
}

function estimateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model];
  if (!pricing) return 0;
  return (inputTokens * pricing[0] / 1_000_000) + (outputTokens * pricing[1] / 1_000_000);
}

async function callAnthropic(apiKey, model, prompt, image, mediaType) {
  const content = [];
  if (image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType || "image/jpeg", data: image },
    });
  }
  content.push({ type: "text", text: prompt });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content: content.length === 1 ? prompt : content }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const rawOutput = data.content.map(c => c.type === "text" ? c.text : "").join("").trim();
  return {
    rawOutput,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

async function callOpenAI(apiKey, model, prompt, image) {
  const content = [];
  if (image) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${image}` },
    });
  }
  content.push({ type: "text", text: prompt });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content: content.length === 1 ? prompt : content }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const rawOutput = data.choices[0].message.content;
  return {
    rawOutput,
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function callGemini(apiKey, model, prompt, image) {
  const parts = [];
  if (image) {
    parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
  }
  parts.push({ text: prompt });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: 2000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return {
    rawOutput,
    inputTokens: data.usageMetadata?.promptTokenCount || 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
  };
}

function parseJSON(rawOutput) {
  const clean = rawOutput.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { step, model, prompt, image, mediaType, apiKeys } = req.body;

  if (!step || !model || !prompt) {
    return res.status(400).json({ error: "Missing required fields: step, model, prompt" });
  }

  const provider = getProvider(model);
  if (!provider) return res.status(400).json({ error: `Unknown model: ${model}` });

  const apiKey = getApiKey(provider, apiKeys || {});
  if (!apiKey) {
    return res.status(400).json({ error: `No API key for ${provider}. Set ${provider === "Anthropic" ? "ANTHROPIC_API_KEY" : provider === "OpenAI" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"} or provide in request.` });
  }

  const startTime = Date.now();

  try {
    let result;
    if (provider === "Anthropic") {
      result = await callAnthropic(apiKey, model, prompt, step === 1 ? image : null, mediaType);
    } else if (provider === "OpenAI") {
      result = await callOpenAI(apiKey, model, prompt, step === 1 ? image : null);
    } else {
      result = await callGemini(apiKey, model, prompt, step === 1 ? image : null);
    }

    const elapsed = Date.now() - startTime;
    const parsed = parseJSON(result.rawOutput);

    return res.status(200).json({
      model,
      provider,
      step,
      elapsed,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: estimateCost(model, result.inputTokens, result.outputTokens),
      result: parsed,
      rawOutput: result.rawOutput,
      error: null,
    });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    return res.status(200).json({
      model,
      provider,
      step,
      elapsed,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      result: null,
      rawOutput: null,
      error: err.message,
    });
  }
}
