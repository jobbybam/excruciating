import { json } from "../_lib/auth.js";
export async function onRequestGet({ env }) {
  const result = await env.DB.prepare("SELECT slug,title,category,thumbnail,description,source_url,license,attribution,published FROM games WHERE source_url IS NULL OR (source_url NOT LIKE '%mashukui/web-games%') ORDER BY title COLLATE NOCASE").all();
  return json({ games: result.results || [] }, 200, { "Cache-Control": "public, max-age=30" });
}
