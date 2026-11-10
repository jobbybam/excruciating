import { json, requireAdmin } from "../../_lib/auth.js";
const validWord = value => /^[a-z0-9][a-z0-9 _'-]{0,39}$/i.test(value);
export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const rows = await env.DB.prepare("SELECT word,created_at FROM chat_word_blocklist ORDER BY word COLLATE NOCASE").all();
  return json({ words: rows.results || [] });
}
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const word = String(body.word || "").trim().toLowerCase();
  if (!validWord(word)) return json({ error: "Use 1–40 letters, numbers, spaces, apostrophes, hyphens or underscores." }, 400);
  await env.DB.prepare("INSERT OR IGNORE INTO chat_word_blocklist(word) VALUES(?)").bind(word).run();
  return json({ ok: true, word }, 201);
}
export async function onRequestDelete({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const word = String(new URL(request.url).searchParams.get("word") || "").trim().toLowerCase();
  if (!validWord(word)) return json({ error: "Invalid blocked word." }, 400);
  await env.DB.prepare("DELETE FROM chat_word_blocklist WHERE word=?").bind(word).run();
  return json({ ok: true });
}
