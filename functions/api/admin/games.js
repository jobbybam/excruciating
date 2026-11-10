import { json, requireAdmin } from "../../_lib/auth.js";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedSource = value => /^https:\/\//i.test(value);
async function ensureFeaturedTable(env) { await env.DB.prepare("CREATE TABLE IF NOT EXISTS featured_games (slug TEXT PRIMARY KEY, position INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))").run(); }
export async function onRequestGet({ request, env }) {
  await ensureFeaturedTable(env);
  const denied = await requireAdmin(request, env); if (denied) return denied;
  let catalogue = [];
  try {
    const response = await fetch(new URL("/catalog/games.json", request.url));
    if (response.ok) { const data = await response.json(); catalogue = Array.isArray(data.games) ? data.games : []; }
  } catch {}
  const rows = await env.DB.prepare("SELECT slug,title,category,thumbnail,description,source_url,license,attribution,published,created_at FROM games WHERE source_url IS NULL OR (source_url NOT LIKE '%mashukui/web-games%') ORDER BY title COLLATE NOCASE").all();
  const bySlug = new Map((rows.results || []).map(row => [row.slug, row]));
  const merged = catalogue.map(game => ({...game,...(bySlug.get(game.slug) || {})}));
  const known = new Set(catalogue.map(game => game.slug));
  for (const row of rows.results || []) if (!known.has(row.slug)) merged.push(row);
  const rows=await env.DB.prepare("SELECT slug,position FROM featured_games ORDER BY position,created_at").all();
  const featured=new Map((rows.results||[]).map(x=>[x.slug,Number(x.position)]));
  return json({games:merged.map(g=>({...g,featured:featured.has(g.slug),featured_position:featured.get(g.slug)??null}))});
}
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const slug = String(body.slug || "").trim().toLowerCase();
  const title = String(body.title || "").trim().slice(0, 80);
  const category = String(body.category || "").trim().slice(0, 30);
  const thumbnail = String(body.thumbnail || "").trim().slice(0, 500);
  const description = String(body.description || "").trim().slice(0, 300);
  const sourceUrl = String(body.source_url || "").trim().slice(0, 500);
  const license = String(body.license || "").trim().slice(0, 180);
  const attribution = String(body.attribution || "").trim().slice(0, 300);
  if (!slugPattern.test(slug) || !title || !category) return json({ error: "A valid slug, title and category are required." }, 400);
  if (!allowedSource(sourceUrl) || !license) return json({ error: "Add the original source URL and the licence or permission terms before publishing." }, 400);
  await env.DB.prepare(`INSERT INTO games (slug,title,category,thumbnail,description,source_url,license,attribution,published)
    VALUES (?,?,?,?,?,?,?,?,1)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title,category=excluded.category,thumbnail=excluded.thumbnail,
    description=excluded.description,source_url=excluded.source_url,license=excluded.license,attribution=excluded.attribution,
    published=1,updated_at=datetime('now')`).bind(slug,title,category,thumbnail,description,sourceUrl,license,attribution).run();
  return json({ ok: true, slug }, 201);
}
export async function onRequestDelete({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!slugPattern.test(slug)) return json({ error: "Invalid game slug." }, 400);
  const body = await request.json().catch(() => ({}));
  const existing = await env.DB.prepare("SELECT slug FROM games WHERE slug=?").bind(slug).first();
  if (existing) {
    await env.DB.prepare("UPDATE games SET published=0,updated_at=datetime('now') WHERE slug=?").bind(slug).run();
  } else {
    const title = String(body.title || "").trim().slice(0,80);
    const category = String(body.category || "").trim().slice(0,30);
    const sourceUrl = String(body.source_url || "").trim().slice(0,500);
    const license = String(body.license || "").trim().slice(0,180);
    if (!title || !category || !allowedSource(sourceUrl) || !license) return json({ error: "Could not hide this catalogue game because its metadata is incomplete." }, 400);
    await env.DB.prepare("INSERT INTO games (slug,title,category,thumbnail,description,source_url,license,attribution,published) VALUES (?,?,?,?,?,?,?,?,0)")
      .bind(slug,title,category,String(body.thumbnail||"").slice(0,500),String(body.description||"").slice(0,300),sourceUrl,license,String(body.attribution||"").slice(0,300)).run();
  }
  return json({ ok: true, slug, published: false });
}

export async function onRequestPatch({request,env}) { const denied=await requireAdmin(request,env); if(denied)return denied; await ensureFeaturedTable(env); const body=await request.json().catch(()=>({})); const slug=String(body.slug||'').trim().toLowerCase(); const pin=body.featured===true; if(!slugPattern.test(slug))return json({error:'Invalid game slug.'},400); let published=false; const row=await env.DB.prepare('SELECT published FROM games WHERE slug=?').bind(slug).first(); if(row)published=Number(row.published)!==0; else {const response=await fetch(new URL('/catalog/games.json',request.url));const data=response.ok?await response.json():{games:[]};published=(data.games||[]).some(g=>g.slug===slug&&g.published!==false);} if(!published)return json({error:'Only published games can be featured.'},404); const current=await env.DB.prepare('SELECT slug FROM featured_games ORDER BY position,created_at').all(); let slugs=(current.results||[]).map(x=>x.slug).filter(x=>x!==slug); if(pin){if(slugs.length>=5)return json({error:'You can feature a maximum of five games. Unpin one first.'},409);slugs.push(slug);} await env.DB.prepare('DELETE FROM featured_games').run(); for(let i=0;i<slugs.length;i++)await env.DB.prepare('INSERT INTO featured_games (slug,position) VALUES (?,?)').bind(slugs[i],i).run(); return json({ok:true,slug,featured:pin}); }
