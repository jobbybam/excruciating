import {
  cp,
  mkdir,
  open,
  readdir,
  readFile,
  rm,
  stat,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "dist");
const GAME_DIR = path.join(OUT_DIR, "games", "deltarune");
const INDEX_FILE = path.join(GAME_DIR, "index.html");

// Cloudflare Pages rejects an individual static asset above 25 MiB.
// Use 20 MiB segments to leave a comfortable margin below its hard limit.
const PAGES_MAX_BYTES = 25 * 1024 * 1024;
const SEGMENT_BYTES = 20 * 1024 * 1024;
const READ_BUFFER_BYTES = 1024 * 1024;

// These are source/build/runtime directories, not public static assets.
// Pages Functions are discovered from the repository root, not dist/.
const EXCLUDED_ROOT_ENTRIES = new Set([
  ".git",
  ".github",
  ".wrangler",
  "node_modules",
  "dist",
  "functions",
  "migrations",
  "scripts",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "wrangler.toml",
  ".gitignore",
  ".dev.vars",
  ".env"
]);

async function copyStaticSite() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  for (const entry of await readdir(ROOT, { withFileTypes: true })) {
    if (EXCLUDED_ROOT_ENTRIES.has(entry.name)) continue;
    await cp(
      path.join(ROOT, entry.name),
      path.join(OUT_DIR, entry.name),
      { recursive: true, force: true }
    );
  }
}

async function splitArchive(filePath, fileName, fileSize) {
  const oldEntries = await readdir(GAME_DIR);
  const oldParts = oldEntries.filter((entry) =>
    entry.startsWith(`${fileName}.pages-part`)
  );
  await Promise.all(oldParts.map((entry) => unlink(path.join(GAME_DIR, entry))));

  const input = await open(filePath, "r");
  const generated = [];
  let totalRead = 0;
  let partNumber = 0;

  try {
    while (totalRead < fileSize) {
      partNumber += 1;
      const partName = `${fileName}.pages-part${String(partNumber).padStart(3, "0")}`;
      const partPath = path.join(GAME_DIR, partName);
      const output = await open(partPath, "w");
      let partBytes = 0;

      try {
        const buffer = Buffer.allocUnsafe(READ_BUFFER_BYTES);
        while (partBytes < SEGMENT_BYTES && totalRead < fileSize) {
          const requested = Math.min(
            buffer.length,
            SEGMENT_BYTES - partBytes,
            fileSize - totalRead
          );
          const { bytesRead } = await input.read(buffer, 0, requested, null);
          if (bytesRead === 0) {
            throw new Error(`Unexpected end of file while splitting ${fileName}`);
          }

          let offset = 0;
          while (offset < bytesRead) {
            const { bytesWritten } = await output.write(
              buffer,
              offset,
              bytesRead - offset,
              null
            );
            if (bytesWritten === 0) {
              throw new Error(`Could not write archive segment ${partName}`);
            }
            offset += bytesWritten;
          }

          partBytes += bytesRead;
          totalRead += bytesRead;
        }
      } finally {
        await output.close();
      }

      if (partBytes === 0) {
        await unlink(partPath);
        break;
      }
      if (partBytes > PAGES_MAX_BYTES) {
        throw new Error(`Generated segment exceeds the Pages limit: ${partName}`);
      }
      generated.push(partName);
    }
  } finally {
    await input.close();
  }

  if (totalRead !== fileSize || generated.length < 2) {
    throw new Error(
      `Archive split was incomplete for ${fileName} (${totalRead}/${fileSize} bytes)`
    );
  }

  // Only remove the deployment copy once every segment was written successfully.
  await unlink(filePath);
  return generated;
}

async function listFiles(directory, relative = "") {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    const rel = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      results.push(...await listFiles(absolute, rel));
    } else if (entry.isFile()) {
      results.push({ absolute, relative: rel.split(path.sep).join("/") });
    }
  }
  return results;
}

async function installGameShell() {
  const cataloguePath = path.join(OUT_DIR, "catalog", "games.json");
  const catalogue = JSON.parse(await readFile(cataloguePath, "utf8"));
  const newline = String.fromCharCode(10);
  for (const game of catalogue.games ?? []) {
    if (game.published === false || !game.url || !game.url.startsWith("/games/")) continue;
    const gameFile = path.join(OUT_DIR, game.url.slice(1));
    let html;
    try { html = await readFile(gameFile, "utf8"); } catch { continue; }
    if (html.includes("/game-shell.js")) continue;
    const additions = [
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
      '<script src="/game-shell.js"></script>'
    ].join(newline + "    ");
    const headEnd = html.toLowerCase().lastIndexOf("</head>");
    if (headEnd >= 0) {
      html = html.slice(0, headEnd) + "    " + additions + newline + html.slice(headEnd);
    } else {
      const bodyStart = html.toLowerCase().indexOf("<body");
      if (bodyStart >= 0) html = html.slice(0, bodyStart) + additions + newline + html.slice(bodyStart);
    }
    await writeFile(gameFile, html, "utf8");
  }
}

async function main() {
  await copyStaticSite();
  await installGameShell();

  const html = await readFile(INDEX_FILE, "utf8");
  const archiveMapMatch = html.match(
    /(const deltaruneArchives\s*=\s*)(\{[^\n]*\})(;)/
  );
  if (!archiveMapMatch) {
    throw new Error("Could not find the deltaruneArchives map in dist/games/deltarune/index.html");
  }

  const archiveMap = JSON.parse(archiveMapMatch[2]);
  const referencedArchives = [...new Set(Object.values(archiveMap).flat())];
  const splitFiles = new Map();

  for (const fileName of referencedArchives) {
    const archivePath = path.join(GAME_DIR, fileName);
    let info;
    try {
      info = await stat(archivePath);
    } catch {
      const existingParts = (await readdir(GAME_DIR))
        .filter((entry) =>
          entry.startsWith(`${fileName}.pages-part`) &&
          /\.pages-part\d{3}$/.test(entry)
        )
        .sort();
      if (existingParts.length < 2) {
        throw new Error(`Archive is missing and its generated pieces are incomplete: ${fileName}`);
      }
      for (const partName of existingParts) {
        const partInfo = await stat(path.join(GAME_DIR, partName));
        if (partInfo.size > PAGES_MAX_BYTES) {
          throw new Error(`Generated segment exceeds the Pages limit: ${partName}`);
        }
      }
      splitFiles.set(fileName, existingParts);
      continue;
    }

    if (info.size <= PAGES_MAX_BYTES) continue;
    const parts = await splitArchive(archivePath, fileName, info.size);
    splitFiles.set(fileName, parts);
    console.log(
      `Pages build: split ${fileName} (${(info.size / 1024 / 1024).toFixed(2)} MiB) into ${parts.length} pieces.`
    );
  }

  // The deployed loader joins each generated set back into the original byte
  // stream in order. The checked-in index.html and source archives stay intact.
  for (const [chapter, archiveChunks] of Object.entries(archiveMap)) {
    archiveMap[chapter] = archiveChunks.flatMap((fileName) =>
      splitFiles.get(fileName) ?? [fileName]
    );
  }

  const rewrittenHtml = html.replace(
    archiveMapMatch[0],
    `${archiveMapMatch[1]}${JSON.stringify(archiveMap)}${archiveMapMatch[3]}`
  );
  await writeFile(INDEX_FILE, rewrittenHtml, "utf8");

  const outputFiles = await listFiles(OUT_DIR);
  const oversized = [];
  for (const file of outputFiles) {
    const info = await stat(file.absolute);
    if (info.size > PAGES_MAX_BYTES) {
      oversized.push(
        `${file.relative} (${(info.size / 1024 / 1024).toFixed(2)} MiB)`
      );
    }
  }
  if (oversized.length) {
    throw new Error(
      "Files still exceed Cloudflare Pages' 25 MiB asset limit:\n" +
      oversized.map((file) => ` - ${file}`).join("\n")
    );
  }

  for (const [chapter, chunks] of Object.entries(archiveMap)) {
    for (const chunk of chunks) {
      try {
        await stat(path.join(GAME_DIR, chunk));
      } catch {
        throw new Error(`Chapter ${chapter} archive piece is missing: ${chunk}`);
      }
    }
  }

  if (archiveMapMatch[2] && !rewrittenHtml.includes("deltaruneArchives")) {
    throw new Error("Deployment page lost the Deltarune archive map.");
  }
  console.log(
    `Pages build complete: copied ${outputFiles.length} static files to dist/; split ${splitFiles.size} archive file(s); every asset is at or below 25 MiB.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
