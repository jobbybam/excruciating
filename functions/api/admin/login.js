import { createSession, sessionCookie, json } from "../../_lib/auth.js";
const encoder = new TextEncoder();
function equal(a, b) {
  const x = encoder.encode(a), y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "Admin secrets are not configured." }, 503);
  const body = await request.json().catch(() => ({}));
  if (typeof body.password !== "string" || body.password.length > 256 || !equal(body.password, env.ADMIN_PASSWORD)) {
    return json({ error: "Incorrect password." }, 401);
  }
  const token = await createSession(env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
}
