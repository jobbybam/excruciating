import { json, requireAdmin } from "../../_lib/auth.js";

async function ensureTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_changelog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'update' CHECK(kind IN ('added','changed','fixed','removed','update')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
}
const kinds = new Set(["added","changed","fixed","removed","update"]);
function clean(body) {
  const title = typeof body.title === "string" ? body.title.trim().slice(0,100) : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0,1200) : "";
  const kind = kinds.has(body.kind) ? body.kind : "update";
  return { title, details, kind };
}
export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  await ensureTable(env);
  const rows = await env.DB.prepare("SELECT id,title,details,kind,created_at,updated_at FROM site_changelog ORDER BY id DESC LIMIT 100").all();
  return json({ entries: rows.results || [] });
}
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  await ensureTable(env);
  const body = await request.json().catch(() => ({}));
  const entry = clean(body);
  if (!entry.title) return json({ error: "A changelog title is required." }, 400);
  const result = await env.DB.prepare("INSERT INTO site_changelog (title,details,kind) VALUES (?,?,?)").bind(entry.title,entry.details,entry.kind).run();
  return json({ ok: true, id: result.meta?.last_row_id }, 201);
}
export async function onRequestPatch({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  await ensureTable(env);
  const id = Number(new URL(request.url).searchParams.get("id"));
  const body = await request.json().catch(() => ({}));
  const entry = clean(body);
  if (!Number.isSafeInteger(id) || id < 1 || !entry.title) return json({ error: "A valid entry ID and title are required." }, 400);
  const result = await env.DB.prepare("UPDATE site_changelog SET title=?,details=?,kind=?,updated_at=datetime('now') WHERE id=?").bind(entry.title,entry.details,entry.kind,id).run();
  if (!result.meta?.changes) return json({ error: "Changelog entry not found." }, 404);
  return json({ ok: true, id });
}
export async function onRequestDelete({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  await ensureTable(env);
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return json({ error: "Invalid changelog entry ID." }, 400);
  await env.DB.prepare("DELETE FROM site_changelog WHERE id=?").bind(id).run();
  return json({ ok: true });
}
