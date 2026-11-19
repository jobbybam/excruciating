(() => {
  "use strict";

  const container = document.getElementById("game");
  const errorPanel = document.getElementById("game-error");
  if (!container || !errorPanel) return;

  const source = container.dataset.swf || "game.swf";

  // A Pages route may be requested as /games/<slug> (without a trailing
  // slash). Treat that as a directory route so relative SWF URLs stay inside
  // the game's folder instead of resolving to /games/.
  const pageUrl = new URL(location.href);
  const lastPathSegment = pageUrl.pathname.split("/").pop() || "";
  if (!pageUrl.pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(lastPathSegment)) {
    pageUrl.pathname += "/";
  }
  const base = new URL("./", pageUrl);

  window.ExcruciatingGameReady = false;
  window.ExcruciatingGameLoadFailed = false;

  const markReady = () => {
    window.ExcruciatingGameReady = true;
    window.dispatchEvent(new Event("excruciating:game-ready"));
  };

  const showError = (message) => {
    errorPanel.hidden = false;
    errorPanel.textContent = message;
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Ruffle could not be loaded."));
    document.head.append(script);
  });

  async function loadDirect(api) {
    const swfUrl = new URL(source, base);
    const response = await fetch(swfUrl, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Game file not found (${response.status}): ${swfUrl.pathname}`);
    }
    await api.load({ data: await response.arrayBuffer(), swfFileName: source, base: base.href });
  }

  async function loadSplit(api, manifestUrl) {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
    if (response.status === 404) return false;
    if (!response.ok) throw new Error(`Game file manifest request failed (${response.status}).`);

    const manifestText = await response.text();
    // Cloudflare Pages can serve the game's HTML fallback with status 200 for a
    // missing static manifest. Treat that response like a missing manifest and
    // load the ordinary SWF instead of trying to parse the page as JSON.
    if (/^\s*</.test(manifestText)) return false;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("json")) {
      throw new Error("The local game file manifest has an unexpected content type.");
    }

    let parts;
    try {
      parts = JSON.parse(manifestText);
    } catch {
      throw new Error("The local game file manifest is not valid JSON.");
    }
    if (!Array.isArray(parts) || parts.length < 2 ||
        parts.some((part) => typeof part !== "string" || !part.trim())) {
      throw new Error("The local game file list is invalid.");
    }

    const buffers = await Promise.all(parts.map(async (part) => {
      const partUrl = new URL(part, base);
      const partResponse = await fetch(partUrl, { cache: "no-cache" });
      if (!partResponse.ok) {
        throw new Error(`Game file part not found (${partResponse.status}): ${partUrl.pathname}`);
      }
      return partResponse.arrayBuffer();
    }));

    const totalBytes = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
    if (!totalBytes) throw new Error("The split game files are empty.");

    const data = new Uint8Array(totalBytes);
    let offset = 0;
    for (const buffer of buffers) {
      data.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    await api.load({ data, swfFileName: source, base: base.href });
    return true;
  }

  async function loadGame() {
    await loadScript("/games/ruffle/ruffle.js");
    const ruffle = window.RufflePlayer?.newest?.();
    if (!ruffle) throw new Error("The local Ruffle player is unavailable.");

    const player = ruffle.createPlayer();
    player.style.width = "100%";
    player.style.height = "100%";
    player.setAttribute("aria-label", "Henry Stickmin game");
    container.replaceChildren(player);

    const api = typeof player.ruffle === "function" ? player.ruffle() : player;
    const manifestUrl = new URL(source + ".parts.json", base);
    const loadedFromParts = await loadSplit(api, manifestUrl);
    if (!loadedFromParts) await loadDirect(api);
    markReady();
  }

  loadGame().catch((error) => {
    window.ExcruciatingGameLoadFailed = true;
    window.dispatchEvent(new Event("excruciating:game-failed"));
    console.error("Could not start the locally hosted Ruffle game.", error);
    showError(error instanceof Error ? error.message : "This game could not start. Reload the page and try again.");
  });
})();
