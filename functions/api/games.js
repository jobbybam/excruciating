import { json } from "../_lib/auth.js";
export async function onRequestGet({ env }) {
  const result = await env.DB.prepare("SELECT slug,title,category,thumbnail,description FROM games WHERE published=1 ORDER BY title COLLATE NOCASE").all();
  return json({ games: result.results || [] }, 200, { "Cache-Control": "public, max-age=60" });
}
