# Excruciating Leg Pain

A self-hosted browser-game library built from files in this repository and deployed with Cloudflare Pages.

## Locally hosted games

- **Undertale** — local browser build in `games/undertale/`.
- **Deltarune** — local browser build in `games/deltarune/`. Its large archive chunks are split for Cloudflare Pages during the build and reassembled by the game loader at runtime.
- **Ballistic** — upstream AGPL-3.0 browser shooter, built and hosted locally in `games/ballistic/`; upstream licence and source are included.
- **14 Papa's games** — local Standard Version SWF files in `games/papas-*/`, played through the local Ruffle WebAssembly runtime in `games/ruffle/`.

Only titles with actual local files are included in the published static catalogue. A link to a remote game is not counted as a self-hosted game.

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

The site and each locally hosted game have their own install manifest and icon. The build picks each game's local icon or catalogue thumbnail and uses it for the game tile and its Home Screen install.

Direct-message push notifications use standard Web Push. To enable them:

1. Run `npm install`, then `npm run generate:vapid` once to create a VAPID key pair. Keep the private key secret.
2. In Cloudflare Pages, set `VAPID_PUBLIC_KEY` to the generated public key, add `VAPID_PRIVATE_KEY` as a secret, and set `VAPID_SUBJECT` to a contact such as `mailto:you@example.com`.
3. Apply the D1 migration with `npx wrangler d1 migrations apply excruciating --remote`.
4. On iPhone or iPad, open the site in Safari, use **Share → Add to Home Screen**, then open it from the new icon. Sign in, open **Install & notifications**, and tap **Enable notifications**.

iOS supports web push for Home Screen web apps from iOS/iPadOS 16.4 onward. The permission prompt is only requested after the user taps the enable button. Push alerts are sent for direct messages, not public chat posts.

## Status

A successful Git commit is not proof that Cloudflare has deployed it or applied D1 migrations. Check the latest Pages deployment and test each game in the live player.
