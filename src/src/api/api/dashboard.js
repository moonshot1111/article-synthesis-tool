// api/dashboard.js
// Returns usage stats — protected by DASHBOARD_SECRET env var.
// Hit: GET /api/dashboard?secret=YOUR_SECRET
//
// Required env vars:
//   UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN, DASHBOARD_SECRET

import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  if (req.query.secret !== process.env.DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  }).reverse();

  const [total, ...dailyCounts] = await Promise.all([
    redis.get("usage:total:analyses"),
    ...days.map(d => redis.get(`usage:daily:${d}`)),
  ]);

  const daily = days.map((date, i) => ({ date, count: Number(dailyCounts[i] || 0) }));

  return res.status(200).json({
    totalAnalyses: Number(total || 0),
    daily,
    generatedAt: new Date().toISOString(),
  });
}
