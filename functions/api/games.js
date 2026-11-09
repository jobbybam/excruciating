import { json } from "../_lib/auth.js";
export async function onRequestGet({ env }) {
  const result = await env.DB.prepare("SELECT slug,title,category,thumbnail,description,source_url FROM games WHERE published=1 AND (source_url IS NULL OR (source_url NOT LIKE '%mashukui/web-games%' AND source_url NOT LIKE '%3kh0%')) ORDER BY title COLLATE NOCASE").all();
  return json({ games: result.results || [] }, 200, { "Cache-Control": "public, max-age=60" });
}
