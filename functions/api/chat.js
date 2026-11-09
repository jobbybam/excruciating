import { json } from "../_lib/auth.js";
const encoder = new TextEncoder();
async function hash(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value || "unknown"));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
export async function onRequestGet({ request, env }) {
  const rows = await env.DB.prepare("SELECT id,username,message,created_at FROM chat_messages ORDER BY id DESC LIMIT 60").all();
  return json({ messages: (rows.results || []).reverse() });
}
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!/^[a-zA-Z0-9_ -]{2,20}$/.test(username)) return json({ error: "Username must be 2–20 letters, numbers, spaces, _ or -." }, 400);
  if (!message || message.length > 500) return json({ error: "Message must be between 1 and 500 characters." }, 400);
  const ipHash = await hash(request.headers.get("CF-Connecting-IP"));
  const recent = await env.DB.prepare("SELECT COUNT(*) AS total FROM chat_messages WHERE (ip_hash=? OR lower(username)=?) AND created_at >= datetime('now','-10 seconds')").bind(ipHash, username.toLowerCase()).first();
  if ((recent?.total || 0) >= 4) return json({ error: "Slow down a moment before sending another message." }, 429);
  const result = await env.DB.prepare("INSERT INTO chat_messages (username,message,ip_hash) VALUES (?,?,?)").bind(username, message, ipHash).run();
  return json({ ok: true, id: result.meta.last_row_id }, 201);
}
