# Excruciating Leg Pain

A self-hosted browser-game library built from files in this repository and deployed with Cloudflare Pages.

## Locally hosted games

The catalogue contains 86 games with local `/games/...` pages and 15 links that still open their publishers' sites. Local highlights include:

- **Undertale and Deltarune** — browser builds in `games/undertale/` and `games/deltarune/`. Deltarune archive chunks are split for Cloudflare Pages during the build and reassembled by the loader.
- **14 Papa's games** — Standard Version SWF files played through the local Ruffle WebAssembly runtime.
- **Henry Stickmin** — the five original Flash games, played through the local Ruffle runtime.
- **Temple Run 2, Retro Bowl, Google Feud, and Unlimited Wordle** — locally bundled game packages with matching catalogue icons.
- **Idle Mining Empire** — the official responsive HTML5 package, hosted locally with permission from the publisher.

Only entries whose game files are in the repository are described as self-hosted. A remote catalogue link is not counted as a local game.

## Add games

Follow [ADDING_GAMES.md](ADDING_GAMES.md). In brief:

1. Add the game's complete files to `games/<slug>/`, with `index.html` directly inside the folder.
2. Check that you created the game, have written permission, or its licence allows redistribution and self-hosting.
3. Commit the game files to `main`.
4. Publish it in the static catalogue only after checking that it runs locally.

Keep all local asset paths working. Do not copy proprietary games or assets just because a browser archive or GitHub repository contains them.

## Cloudflare build

The build command is `npm run build`. It creates a clean `dist/` deployment directory, copies the static site into it, splits any Deltarune archive file larger than Cloudflare Pages' 25 MiB per-file limit into 20 MiB pieces, and updates only the deployment copy of the Deltarune loader's archive map. The loader fetches those pieces and concatenates them in their original order into a Blob before starting the game.

The original Deltarune archive chunks in Git remain unchanged. Pages Functions and D1 migrations remain in the repository root and are not copied into the static output directory.

## Cloudflare Pages setup

Use these settings for the Pages project:

- **Root directory:** `.` (the repository root, without a subdirectory)
- **Build command:** `npm run build`
- **Build output directory:** `dist`

The Wrangler configuration also sets `pages_build_output_dir = "./dist"`.

The root `_headers` file sets the Ruffle `.wasm` files to `Content-Type: application/wasm`, which is required for reliable WebAssembly loading.

## Cloudflare services

- Pages serves the static site and locally hosted game assets.
- Pages Functions provide the API and admin/chat routes.
- D1 stores the catalogue and chat messages.
- No R2 bucket or paid storage service is used.

Visitors can read public chat without an account. Signing in is required to post, use direct messages, and manage an account. Accounts can change their username once every three days; the server enforces the cooldown.

Admins can terminate and restore non-admin accounts from the admin panel. Terminated accounts cannot sign in, post, or send direct messages; existing public chat history is retained.

Apply all pending D1 migrations with `npx wrangler d1 migrations apply excruciating --remote`. This includes the account cooldown and account termination fields. Set `ADMIN_PASSWORD` and `SESSION_SECRET` as Pages secrets in Cloudflare. Never commit passwords, session secrets or API tokens. Admin is available at `/admin` and is intentionally not linked on the public page.

### Home Screen installs and notifications

See [WEB_PUSH_SETUP.md](docs/WEB_PUSH_SETUP.md) for generating and configuring VAPID keys, enabling direct-message alerts, and moving the site to a new domain. On iPhone and iPad, add Excruciating from Safari using **Share → Add to Home Screen**, then open the new icon.

## Status

A successful Git commit is not proof that Cloudflare has deployed it or applied D1 migrations. Check the latest Pages deployment and test each game in the live player.
