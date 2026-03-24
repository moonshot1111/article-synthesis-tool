// api/analyze.js
// Required env vars:
//   ANTHROPIC_KEY        — from console.anthropic.com
//   UPSTASH_REDIS_URL    — from upstash.com (free tier)
//   UPSTASH_REDIS_TOKEN  — from upstash.com (free tier)
//   ALLOWED_ORIGIN       — your production domain, e.g. https://yourdomain.com

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "rl:analyze",
});

const SYSTEM = `You are a nonpartisan media analysis assistant. Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.`;

function buildPrompt(text, pubInfo) {
  return `${pubInfo ? pubInfo + "\n\n" : ""}Analyze this article and return ONLY a JSON object:
{
  "tldr": "One sentence summary.",
  "summary": "One paragraph (4-6 sentences).",
  "contentScore": <integer -100 (far left) to 100 (far right)>,
  "contentBias": "<1-2 sentences explaining the score>",
  "partisanStatements": [
    { "quote": "<quote or close paraphrase>", "lean": "<left|right|neutral>", "explanation": "<why partisan>" }
  ]
}

Include 2-5 partisanStatements. contentScore: Reuters/AP ≈ 0; opinion content ≈ ±55-70. Return ONLY the JSON.

Article:
${text}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "anonymous";
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", reset);
  if (!success) return res.status(429).json({ error: "rate_limited" });

  const { text, pubInfo } = req.body || {};
  if (!text || typeof text !== "string" || text.length < 50) {
    return res.status(400).json({ error: "Missing or too-short text" });
  }
  if (!process.env.ANTHROPIC_KEY) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_KEY,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM,
        messages: [{ role: "user", content: buildPrompt(text.substring(0, 8000), pubInfo || "") }],
      }),
    });

    if (!aiRes.ok) {
      console.error("Anthropic error:", await aiRes.text());
      return res.status(502).json({ error: "AI service error" });
    }

    const aiData = await aiRes.json();
    const raw = aiData.content?.map(b => b.text || "").join("") || "";
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/gi, "").trim()); }
    catch { return res.status(502).json({ error: "AI returned invalid JSON" }); }

    try {
      const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN });
      const day = new Date().toISOString().slice(0, 10);
      await Promise.all([
        redis.incr("usage:total:analyses"),
        redis.incr(`usage:daily:${day}`),
        redis.expire(`usage:daily:${day}`, 60 * 60 * 24 * 90),
      ]);
    } catch {}

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("analyze error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
