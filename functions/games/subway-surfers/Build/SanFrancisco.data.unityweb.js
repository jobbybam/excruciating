export async function onRequest({ request, env }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const fetchAsset = url => env.ASSETS?.fetch ? env.ASSETS.fetch(url) : fetch(url);
  const manifestUrl = new URL("./SanFrancisco.data.unityweb.parts.json", request.url);
  const manifestResponse = await fetchAsset(manifestUrl);
  if (!manifestResponse.ok) return new Response("Game data is unavailable", { status: 503 });

  const partNames = await manifestResponse.json();
  if (!Array.isArray(partNames) || partNames.length < 2 || partNames.some(name => typeof name !== "string" || !/^SanFrancisco\.data\.unityweb\.pages-part\d{3}$/.test(name))) {
    return new Response("Game data manifest is invalid", { status: 503 });
  }

  const partResponses = await Promise.all(partNames.map(name => fetchAsset(new URL(name, request.url))));
  if (partResponses.some(response => !response.ok)) {
    return new Response("Game data is incomplete", { status: 503 });
  }

  const partBuffers = await Promise.all(partResponses.map(response => response.arrayBuffer()));
  const body = new Blob(partBuffers, { type: "application/octet-stream" });
  const headers = new Headers({
    "Content-Type": "application/octet-stream",
    "Content-Length": String(body.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "none"
  });
  return new Response(request.method === "HEAD" ? null : body, { headers });
}
