// server.js (use this entire file or replace route)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// simple file cache directory
const CACHE_DIR = path.join(process.cwd(), "pose_cache");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// same makePrompt() from above
function makePrompt(word) {
  return `
You are an AI that outputs ONLY valid JSON (no explanation, no markdown) describing a short sign-language animation for a humanoid Mixamo-style skeleton.

RETURN this exact JSON schema:

{
  "animations": [
    [
      ["mixamorigBoneName","rotation","x",<number>,"+"],
      ["mixamorigAnotherBone","rotation","z",<number>,"-"]
    ],
    [
      ["mixamorigBoneName","rotation","y",<number>,"+"]
    ]
  ]
}

- "animations" is an array of animation blocks.
- Each animation block is an array of animation entries to be pushed together (i.e. one phase).
- Each entry is [boneName, property, axis, value, sign].
  - boneName: Mixamo bone string (e.g. "mixamorigRightArm").
  - property: "rotation" or "position".
  - axis: "x","y","z".
  - value: number in radians (float).
  - sign: "+" or "-".

Return a short, plausible animation for the English word "${word}" — keep arrays short. No text or comments — ONLY JSON.

Example output for "bye":

{
  "animations": [
    [
      ["mixamorigNeck","rotation","x",0.05,"+"],
      ["mixamorigRightArm","rotation","z",1.2,"+"],
      ["mixamorigRightForeArm","rotation","y",1.5,"+"],
      ["mixamorigRightHand","rotation","z",0.8,"+"]
    ],
    [
      ["mixamorigRightForeArm","rotation","z",0.2,"-"],
      ["mixamorigRightForeArm","rotation","y",1.2,"-"]
    ]
  ]
}

Now generate JSON for the word "${word}" using the schema above.
`.trim();
}

async function askOpenAI(word) {
  const prompt = makePrompt(word);
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3, // low temp for deterministic JSON
    max_tokens: 600,
  });
  return completion.choices?.[0]?.message?.content || "";
}

function parseJsonFromModel(text) {
  const match = text.match(/\{[\s\S]*\}/);
  const jsonText = match ? match[0] : text;
  return JSON.parse(jsonText);
}

function isValidAnimationPayload(payload) {
  if (!payload || !Array.isArray(payload.animations)) return false;
  for (const block of payload.animations) {
    if (!Array.isArray(block)) return false;
    for (const entry of block) {
      if (!Array.isArray(entry) || entry.length < 4) return false;
      const [bone, prop, axis, value] = entry;
      if (typeof bone !== "string") return false;
      if (!["rotation", "position"].includes(prop)) return false;
      if (!["x", "y", "z"].includes(axis)) return false;
      if (typeof value !== "number") return false;
      // optional 5th sign char
    }
  }
  return true;
}

app.post("/generate-animation", async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== "string")
      return res.status(400).json({ error: "Missing word" });

    const key = word.trim().toLowerCase().replace(/\s+/g, "_");
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      return res.json({ animations: cached.animations, source: "cache" });
    }

    const text = await askOpenAI(word);
    let payload;
    try {
      payload = parseJsonFromModel(text);
    } catch (err) {
      console.error("JSON parse error:", err, "raw:", text);
      return res
        .status(500)
        .json({ error: "Model returned invalid JSON", raw: text });
    }

    if (!isValidAnimationPayload(payload)) {
      console.error("Invalid payload shape:", payload);
      return res
        .status(500)
        .json({ error: "Invalid animation payload", payload });
    }

    // Save to cache
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(payload, null, 2), "utf8");
    } catch (e) {
      console.warn("Cache write failed:", e.message);
    }

    return res.json({ animations: payload.animations, source: "ai" });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`OpenAI proxy listening on ${port}`));
