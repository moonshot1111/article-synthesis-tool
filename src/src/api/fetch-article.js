// api/fetch-article.js
// Required env vars:
//   FIRECRAWL_KEY        — from firecrawl.dev
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
  prefix: "rl:fetch",
});

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

  const { url } = req.body || {};
  if (!url || typeof url !== "string") return res.status(400).json({ error: "Missing url" });

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: "Invalid URL" }); }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs are allowed" });
  }

  if (!process.env.FIRECRAWL_KEY) return res.status(500).json({ error: "FIRECRAWL_KEY not configured" });

  try {
    const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });

    const fcData = await fcRes.json();
    if (fcRes.status === 402) return res.status(402).json({ error: "paywall" });
    if (fcRes.status === 429) return res.status(429).json({ error: "rate_limited" });
    if (!fcRes.ok || !fcData.success) return res.status(502).json({ error: fcData.error || "firecrawl_error" });

    const text = (fcData.data?.markdown || "").substring(0, 12000);
    if (text.length < 100) return res.status(422).json({ error: "too_short" });

    return res.status(200).json({ text });
  } catch (err) {
    console.error("fetch-article error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
