import { json } from "../_lib/auth.js";

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

export async function onRequestGet({ env }) {
  await ensureTable(env);
  const rows = await env.DB.prepare("SELECT id,title,details,kind,created_at,updated_at FROM site_changelog ORDER BY id DESC LIMIT 100").all();
  return json({ entries: rows.results || [] }, 200, { "Cache-Control": "public, max-age=60" });
}
