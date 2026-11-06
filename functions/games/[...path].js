const types = {html:"text/html; charset=utf-8",js:"text/javascript; charset=utf-8",css:"text/css; charset=utf-8",json:"application/json",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",svg:"image/svg+xml",wasm:"application/wasm",mp3:"audio/mpeg",ogg:"audio/ogg",wav:"audio/wav",mp4:"video/mp4",webm:"video/webm",woff2:"font/woff2",ttf:"font/ttf"};
export async function onRequest({ request, env, params }) {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  const key = String(params.path || "");
  if (!key || key.includes("..") || key.startsWith("/")) return new Response("Not found", { status: 404 });
  const object = await env.GAMES.get(key);
  if (!object) return new Response("Game file not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "public, max-age=3600");
  if (!headers.has("Content-Type")) headers.set("Content-Type", types[key.split(".").pop().toLowerCase()] || "application/octet-stream");
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}
