import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const loaderSource = await readFile(new URL("../ruffle-game.js", import.meta.url), "utf8");

async function runLoader(fetchHandler) {
  const requests = [];
  let loadedOptions;
  let ready;
  let failed;
  const result = new Promise((resolve, reject) => {
    ready = resolve;
    failed = reject;
  });

  const container = {
    dataset: { swf: "game.swf" },
    replaceChildren() {},
  };
  const errorPanel = { hidden: true, textContent: "" };
  const api = {
    load: async (options) => {
      loadedOptions = options;
    },
  };
  const player = {
    style: {},
    setAttribute() {},
    ruffle: () => api,
  };
  const document = {
    getElementById(id) {
      return id === "game" ? container : id === "game-error" ? errorPanel : null;
    },
    createElement() {
      return { onload: null, onerror: null, src: "" };
    },
    head: {
      append(script) {
        queueMicrotask(() => script.onload?.());
      },
    },
  };
  const window = {
    RufflePlayer: { newest: () => ({ createPlayer: () => player }) },
    dispatchEvent(event) {
      if (event.type === "excruciating:game-ready") ready();
      if (event.type === "excruciating:game-failed") failed(new Error("Game load failed"));
    },
  };
  const fetch = async (request) => {
    const url = new URL(String(request), "https://example.test/");
    requests.push(url.pathname);
    return fetchHandler(url.pathname);
  };

  vm.runInNewContext(loaderSource, {
    document,
    window,
    location: { href: "https://example.test/games/henry-breaking-the-bank/" },
    fetch,
    URL,
    Event,
    Promise,
    Uint8Array,
    console,
    setTimeout,
    clearTimeout,
  });

  await Promise.race([
    result,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Loader timed out")), 2000)),
  ]);
  return { requests, loadedOptions, errorPanel, window };
}

function response(status, body, contentType) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? contentType : null },
    text: async () => bytes.toString("utf8"),
    json: async () => JSON.parse(bytes.toString("utf8")),
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

test("falls back to the direct SWF when Pages returns HTML for a missing manifest", async () => {
  const swf = Buffer.from([0x43, 0x57, 0x53, 0x09]);
  const result = await runLoader((pathname) => {
    if (pathname.endsWith("game.swf.parts.json")) {
      return response(200, "<!doctype html><html><body>fallback</body></html>", "text/html; charset=utf-8");
    }
    if (pathname.endsWith("/game.swf")) return response(200, swf, "application/octet-stream");
    throw new Error(`Unexpected request: ${pathname}`);
  });

  assert.deepEqual(result.requests, [
    "/games/henry-breaking-the-bank/game.swf.parts.json",
    "/games/henry-breaking-the-bank/game.swf",
  ]);
  assert.equal(result.loadedOptions.data.byteLength, swf.length);
  assert.equal(result.loadedOptions.swfFileName, "game.swf");
  assert.equal(result.window.ExcruciatingGameReady, true);
  assert.equal(result.window.ExcruciatingGameLoadFailed, false);
  assert.equal(result.errorPanel.hidden, true);
});

test("still loads valid split SWF manifests in listed order", async () => {
  const chunks = new Map([
    ["game.swf.pages-part001", Buffer.from([0x43, 0x57])],
    ["game.swf.pages-part002", Buffer.from([0x53, 0x09])],
  ]);
  const result = await runLoader((pathname) => {
    if (pathname.endsWith("game.swf.parts.json")) {
      return response(200, JSON.stringify([...chunks.keys()]), "application/json");
    }
    const name = pathname.split("/").at(-1);
    if (chunks.has(name)) return response(200, chunks.get(name), "application/octet-stream");
    throw new Error(`Unexpected request: ${pathname}`);
  });

  assert.deepEqual([...new Uint8Array(result.loadedOptions.data)], [0x43, 0x57, 0x53, 0x09]);
  assert.equal(result.requests.includes("/games/henry-breaking-the-bank/game.swf"), false);
  assert.equal(result.window.ExcruciatingGameReady, true);
});

test("Excruciating Phone inline JavaScript parses", async () => {
  const page = await readFile(new URL("../games/excruciating-phone/index.html", import.meta.url), "utf8");
  const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, "expected one inline game script");
  assert.doesNotThrow(() => new vm.Script(scripts[0][1], { filename: "excruciating-phone.js" }));
});
