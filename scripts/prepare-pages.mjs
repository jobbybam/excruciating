import {
  open,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const GAME_DIR = path.join(ROOT, "games", "deltarune");
const INDEX_FILE = path.join(GAME_DIR, "index.html");

// Cloudflare Pages rejects a single static asset above 25 MiB.
// Keep each generated piece comfortably below that hard limit.
const PAGES_MAX_BYTES = 25 * 1024 * 1024;
const SEGMENT_BYTES = 20 * 1024 * 1024;
const READ_BUFFER_BYTES = 1024 * 1024;

async function splitArchive(filePath, fileName, fileSize) {
  // Remove remnants from an interrupted or repeated build before recreating
  // the pieces. The original archive remains available until splitting passes.
  const entries = await readdir(GAME_DIR);
  const oldParts = entries.filter((entry) =>
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

  // Only remove the source after every output segment has been written.
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

async function main() {
  // Read the checked-in map first so a retry can recover if a previous build
  // stopped after generating segments but before rewriting index.html.
  const html = await readFile(INDEX_FILE, "utf8");
  const archiveMapMatch = html.match(
    /(const deltaruneArchives\\s*=\\s*)(\\{[^\\n]*\\})(;)/
  );
  if (!archiveMapMatch) {
    throw new Error("Could not find the deltaruneArchives map in games/deltarune/index.html");
  }

  const archiveMap = JSON.parse(archiveMapMatch[2]);
  const referencedArchives = [...new Set(Object.values(archiveMap).flat())];
  const directoryEntries = await readdir(GAME_DIR);
  const splitFiles = new Map();

  for (const fileName of referencedArchives) {
    const archivePath = path.join(GAME_DIR, fileName);
    let info;
    try {
      info = await stat(archivePath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;

      // Resume a partially completed build if its source was already removed.
      const existingParts = directoryEntries
        .filter((entry) =>
          entry.startsWith(`${fileName}.pages-part`) &&
          /\\.pages-part\\d{3}$/.test(entry)
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

  // Rewrite only the generated deployment copy of the archive map. The
  // checked-in index.html still points to the original files for local use.
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

  // Fail early with a useful filename rather than allowing Pages asset
  // validation to fail later with the generic exit-code message.
  const oversized = [];
  for (const file of await listFiles(ROOT)) {
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

  // Confirm that every filename in the rewritten map exists before upload.
  for (const [chapter, chunks] of Object.entries(archiveMap)) {
    for (const chunk of chunks) {
      const chunkPath = path.join(GAME_DIR, chunk);
      try {
        await stat(chunkPath);
      } catch {
        throw new Error(`Chapter ${chapter} archive piece is missing: ${chunk}`);
      }
    }
  }

  console.log(
    `Pages build preparation complete. Split ${splitFiles.size} archive file(s); all output assets are at or below 25 MiB.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
