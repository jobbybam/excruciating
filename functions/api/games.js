import { json } from "../_lib/auth.js";
async function ensureFeaturedTable(env) { await env.DB.prepare("CREATE TABLE IF NOT EXISTS featured_games (slug TEXT PRIMARY KEY, position INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))").run(); }
export async function onRequestGet({ env }) {
  await ensureFeaturedTable(env);
  const result = await env.DB.prepare("SELECT slug,title,category,thumbnail,description,source_url,license,attribution,published FROM games WHERE source_url IS NULL OR (source_url NOT LIKE '%mashukui/web-games%') ORDER BY title COLLATE NOCASE").all();
  const rows=await env.DB.prepare("SELECT slug,position FROM featured_games ORDER BY position,created_at").all();
  const featured=new Map((rows.results||[]).map(x=>[x.slug,Number(x.position)]));
  return json({games:(result.results||[]).map(g=>({...g,featured:featured.has(g.slug),featured_position:featured.get(g.slug)??null}))},200,{"Cache-Control":"public, max-age=30"});
}
