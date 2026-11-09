import { json, requireAdmin } from "../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const rows = await env.DB.prepare("SELECT id,username,message,created_at FROM chat_messages ORDER BY id DESC LIMIT 150").all();
  return json({ messages: rows.results || [] });
}
export async function onRequestDelete({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return json({ error: "Invalid message ID." }, 400);
  await env.DB.prepare("DELETE FROM chat_messages WHERE id=?").bind(id).run();
  return json({ ok: true });
}
