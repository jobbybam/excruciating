export async function onRequest({ request, next }) {
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  const path = new URL(request.url).pathname;
  const gameRoute = path.startsWith("/games/");
  const policy = gameRoute
    ? "default-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https: blob:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; connect-src 'self' data: blob: https: wss:; media-src 'self' data: blob: https:; font-src 'self' data: https:; worker-src 'self' blob:; frame-src 'self' blob: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
    : "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; frame-src 'self' https://raw.githack.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'";
  headers.set("Content-Security-Policy", policy);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
