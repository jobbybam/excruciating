import { json, requireAdmin } from "../../_lib/auth.js";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const safePath = value => typeof value === "string" && value.length <= 240 && !value.startsWith("/") && !value.includes("..") && /^[a-zA-Z0-9._/-]+$/.test(value);
const mime = path => ({html:"text/html; charset=utf-8",js:"text/javascript; charset=utf-8",css:"text/css; charset=utf-8",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",svg:"image/svg+xml",wasm:"application/wasm",mp3:"audio/mpeg",ogg:"audio/ogg",wav:"audio/wav",mp4:"video/mp4",webm:"video/webm",woff2:"font/woff2",ttf:"font/ttf"}[path.split(".").pop().toLowerCase()] || "application/octet-stream");
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "";
  const path = url.searchParams.get("path") || "";
  if (!slugPattern.test(slug) || !safePath(path)) return json({ error: "Invalid game or file path." }, 400);
  const file = await request.arrayBuffer();
  if (!file.byteLength || file.byteLength > 20 * 1024 * 1024) return json({ error: "Each file must be between 1 byte and 20 MB." }, 413);
  await env.GAMES.put(slug + "/" + path, file, { httpMetadata: { contentType: mime(path), cacheControl: "public, max-age=3600" } });
  return json({ ok: true, path, bytes: file.byteLength });
}
