const encoder = new TextEncoder();
const COOKIE = "__Host-excruciating_admin";

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
export async function createSession(secret) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000, role: "admin" })));
  return payload + "." + toBase64Url(await sign(payload, secret));
}
export async function isAdmin(request, env) {
  if (!env.SESSION_SECRET) return false;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  if (!match) return false;
  const [payload, signature] = match.slice(COOKIE.length + 1).split(".");
  if (!payload || !signature) return false;
  try {
    const expected = await sign(payload, env.SESSION_SECRET);
    const actual = fromBase64Url(signature);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    if (diff) return false;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return data.role === "admin" && data.exp > Date.now();
  } catch { return false; }
}
export function sessionCookie(token, maxAge = 28800) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
}
export async function requireAdmin(request, env) {
  if (!(await isAdmin(request, env))) return json({ error: "Unauthorised" }, 401);
  return null;
}
