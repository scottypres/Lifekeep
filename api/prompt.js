import { readFileSync, writeFileSync, existsSync } from "fs";

const PROMPTS_PATH = "/tmp/lifekeep_prompts.json";

function readPrompts() {
  try {
    if (existsSync(PROMPTS_PATH)) {
      return JSON.parse(readFileSync(PROMPTS_PATH, "utf-8"));
    }
  } catch {}
  return { activeVersion: null, versions: [] };
}

function writePrompts(data) {
  writeFileSync(PROMPTS_PATH, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — return prompt versions
  if (req.method === "GET") {
    const data = readPrompts();
    const version = req.query.version;

    if (version) {
      const v = data.versions.find(v => v.version === parseInt(version));
      if (!v) return res.status(404).json({ error: "Version not found" });
      return res.status(200).json(v);
    }

    return res.status(200).json(data);
  }

  // POST — save new prompt version
  if (req.method === "POST") {
    try {
      const { content, notes, source } = req.body;
      if (!content) return res.status(400).json({ error: "Prompt content required" });

      const data = readPrompts();
      const nextVersion = data.versions.length > 0
        ? Math.max(...data.versions.map(v => v.version)) + 1
        : 1;

      const newVersion = {
        version: nextVersion,
        content,
        notes: notes || "",
        createdAt: new Date().toISOString(),
        source: source || "manual",
      };

      data.versions.push(newVersion);
      data.activeVersion = nextVersion;
      writePrompts(data);

      return res.status(200).json({ success: true, version: nextVersion, total: data.versions.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT — set active version
  if (req.method === "PUT") {
    try {
      const { activeVersion } = req.body;
      if (activeVersion == null) return res.status(400).json({ error: "activeVersion required" });

      const data = readPrompts();
      const exists = data.versions.find(v => v.version === parseInt(activeVersion));
      if (!exists) return res.status(404).json({ error: "Version not found" });

      data.activeVersion = parseInt(activeVersion);
      writePrompts(data);

      return res.status(200).json({ success: true, activeVersion: data.activeVersion });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
