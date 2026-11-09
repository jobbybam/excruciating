import { createSession, sessionCookie, json } from "../../_lib/auth.js";
const encoder = new TextEncoder();
function equal(a, b) {
  const x = encoder.encode(a), y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}
async function hash(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value || "unknown"));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "Admin secrets are not configured." }, 503);
  const ipHash = await hash(request.headers.get("CF-Connecting-IP"));
  const attempt = await env.DB.prepare("SELECT failures,window_start,blocked_until FROM admin_login_attempts WHERE ip_hash=?").bind(ipHash).first();
  if (attempt?.blocked_until && new Date(attempt.blocked_until.replace(" ", "T") + "Z").getTime() > Date.now()) {
    return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  }
  const body = await request.json().catch(() => ({}));
  if (typeof body.password !== "string" || body.password.length > 256 || !equal(body.password, env.ADMIN_PASSWORD)) {
    await env.DB.prepare(`INSERT INTO admin_login_attempts (ip_hash,failures,window_start,blocked_until)
      VALUES (?,1,datetime('now'),NULL)
      ON CONFLICT(ip_hash) DO UPDATE SET
      failures=CASE WHEN window_start < datetime('now','-15 minutes') THEN 1 ELSE failures+1 END,
      window_start=CASE WHEN window_start < datetime('now','-15 minutes') THEN datetime('now') ELSE window_start END,
      blocked_until=CASE WHEN (CASE WHEN window_start < datetime('now','-15 minutes') THEN 1 ELSE failures+1 END)>=5 THEN datetime('now','+15 minutes') ELSE NULL END`).bind(ipHash).run();
    return json({ error: "Incorrect password." }, 401);
  }
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip_hash=?").bind(ipHash).run();
  const token = await createSession(env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
}
