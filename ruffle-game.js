(() => {
  "use strict";
  const container = document.getElementById("game");
  const errorPanel = document.getElementById("game-error");
  if (!container || !errorPanel) return;

  const source = container.dataset.swf || "game.swf";
  const base = new URL("./", location.href);
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
    const manifestResponse = await fetch(new URL(source + ".parts.json", base), { cache: "force-cache" });
    if (!manifestResponse.ok) {
      await api.load({ url: new URL(source, base).href });
      return;
    }

    const parts = await manifestResponse.json();
    if (!Array.isArray(parts) || parts.length < 2 || parts.some((part) => typeof part !== "string")) {
      throw new Error("The local game file list is invalid.");
    }
    const buffers = await Promise.all(parts.map(async (part) => {
      const response = await fetch(new URL(part, base), { cache: "force-cache" });
      if (!response.ok) throw new Error("A local game file could not be loaded.");
      return response.arrayBuffer();
    }));
    const totalBytes = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
    const data = new Uint8Array(totalBytes);
    let offset = 0;
    for (const buffer of buffers) {
      data.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    await api.load({ data, swfFileName: source, base: base.href });
  }

  loadGame().catch((error) => {
    console.error("Could not start the locally hosted Ruffle game.", error);
    showError("This game could not start. Reload the page, or try again when the local game files are available.");
  });
})();
