# Excruciating Leg Pain

A browser-game library deployed with Cloudflare Pages. It hosts selected games locally and links to third-party hosted games when redistribution rights are not recorded.

## Locally hosted games

The catalogue retains games listed on [024333.xyz](https://024333.xyz/), plus Deltarune and the five Henry Stickmin games. It contains 24 local game pages and 9 HTTPS links that open the actual third-party hosted games on 024333.xyz. The linked games are not copied into this repository.

- **Papa's Pizzeria** — hosted locally with Flipline Studios' website hosting permission and played through the local Ruffle WebAssembly runtime.
- **Deltarune and the five Henry Stickmin games** — locally hosted browser/Flash builds. The build checks the Deltarune archive and splits oversized game files for Cloudflare Pages.
- **BitLife, Jetpack Joyride, Moto X3M, PolyTrack, four FNAF games, Drive Mad, Drift Boss, Cut the Rope, Paper.io 2, Tiny Fishing, Monkey Mart, Subway Surfers, Google Feud, and Eaglercraft** — locally hosted games retained from the reference site's catalogue.
- **Krillion, Count Master, Wordle Unlimited, Stack, Idle Mining Empire, Bottle Flip, Cubes 2048 IO, Helix Jump, and Ballistic** — actual games launched on their 024333.xyz source pages, with their artwork served by that site.

Local games launch from `/games/<slug>/`. External games open their HTTPS source page in a new tab and are marked in the catalogue. Local imports retain their source and licence metadata.

## Add games

Follow [ADDING_GAMES.md](ADDING_GAMES.md). In brief:

1. Add the game's complete files to `games/<slug>/`, with `index.html` directly inside the folder.
2. Check that you created the game, have written permission, or its licence allows redistribution and self-hosting.
3. Commit the game files to `main`.
4. Publish it in the static catalogue only after checking that it runs locally.

Keep all local asset paths working. Do not copy proprietary games or assets just because a browser archive or GitHub repository contains them.

## Mobile controls

Local game pages receive the shared toolbar from the Pages middleware. On touch devices, controls can be shown or hidden and repositioned. Deltarune, Subway Surfers, Monkey Mart and Eaglercraft have game-specific touch controls. Games with built-in touch interfaces, including Moto X3M, PolyTrack and Drive Mad, keep those native controls rather than receiving a competing overlay. Linked games run on their source site with its own controls.

## Cloudflare build

The build command is `npm run build`. It creates a clean `dist/` deployment directory, splits Deltarune archive files and oversized Henry SWFs into 20 MiB pieces, and checks every local asset against Cloudflare Pages' 25 MiB per-file limit. Split maps are written only to the deployment copy.

Pages Functions and D1 migrations remain in the repository root and are not copied into the static output directory.

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
