import { json, requireAdmin } from "../../_lib/auth.js";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const rows = await env.DB.prepare("SELECT slug,title,category,thumbnail,description,source_url,license,attribution,published,created_at FROM games WHERE source_url IS NULL OR (source_url NOT LIKE '%mashukui/web-games%' AND source_url NOT LIKE '%3kh0%') ORDER BY title COLLATE NOCASE").all();
  return json({ games: rows.results || [] });
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
  const license = String(body.license || "").trim().slice(0, 100);
  const attribution = String(body.attribution || "").trim().slice(0, 300);
  if (!slugPattern.test(slug) || !title || !category) return json({ error: "A valid slug, title and category are required." }, 400);
  if (!/^https:\/\//i.test(sourceUrl) || !license) return json({ error: "Add the original source URL and the licence or permission terms before publishing." }, 400);
  await env.DB.prepare(`INSERT INTO games (slug,title,category,thumbnail,description,source_url,license,attribution,published)
    VALUES (?,?,?,?,?,?,?,?,1)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title,category=excluded.category,thumbnail=excluded.thumbnail,
    description=excluded.description,source_url=excluded.source_url,license=excluded.license,attribution=excluded.attribution,
    updated_at=datetime('now')`).bind(slug,title,category,thumbnail,description,sourceUrl,license,attribution).run();
  return json({ ok: true, slug }, 201);
}
export async function onRequestDelete({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!slugPattern.test(slug)) return json({ error: "Invalid game slug." }, 400);
  await env.DB.prepare("DELETE FROM games WHERE slug=?").bind(slug).run();
  return json({ ok: true });
}
