# excruciating

A self-hosted HTML5 browser game library.

## Features

- Minimal black-and-white game catalogue with square thumbnails, search and categories.
- Same-origin game player with reload and fullscreen controls.
- Public username-based chat with timestamps and basic per-IP/per-name rate limiting.
- Password-protected `/admin` dashboard with signed, HttpOnly admin sessions.
- Admin game upload to Cloudflare R2, catalogue management and chat deletion.
- D1-backed catalogue and chat storage.
- Game source, licence and attribution metadata required before publishing.

## Cloudflare setup

This repository is configured for Cloudflare Pages Functions, D1 and R2. The account resources must be created and connected before the site can run.

1. Create a Pages project named `excruciating` and connect this GitHub repository. Use the repository root (`.`) as the build output directory; there is no build command.
2. Create the D1 database:
   ```sh
   npx wrangler d1 create excruciating
   ```
   Put the returned database ID in `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
3. Create the R2 bucket:
   ```sh
   npx wrangler r2 bucket create excruciating-games
   ```
4. Apply the schema to the remote D1 database:
   ```sh
   npx wrangler d1 migrations apply excruciating --remote
   ```
5. Set the two secrets on the Pages project. Use a long, unique password and a separately generated random session secret:
   ```sh
   npx wrangler pages secret put ADMIN_PASSWORD --project-name excruciating
   npx wrangler pages secret put SESSION_SECRET --project-name excruciating
   ```
6. Deploy:
   ```sh
   npx wrangler pages deploy . --project-name excruciating
   ```

The D1 and R2 bindings are declared in `wrangler.toml`. Do not commit real passwords, session secrets, API tokens or account credentials. The admin page is at `/admin`; there is intentionally no public admin link.

## Adding games

Sign in at `/admin`, choose a game folder and upload it. The selected folder must contain an `index.html` at its root. Its other files (scripts, styles, images, audio, fonts and data) are uploaded using their relative paths. Each file is limited to 20 MB. The game is served from `/games/<slug>/index.html`.

For each game, the admin form requires:
- The original source URL.
- The applicable licence name or a clear description of the permission obtained.
- Attribution details where required.

Only publish games when the licence or rights-holder permission permits self-hosting and redistribution. A game appearing in an archive is not proof that it can be copied. Keep any required copyright and attribution notices with the game files. The project does not bundle third-party games by default; the catalogue stays empty until properly cleared games are uploaded.

## Chat

Visitors choose a display name; no visitor account is required. Messages are stored in D1. The backend limits bursts of messages, and admins can delete messages from the dashboard. Usernames are not verified identities.

## Project structure

- `index.html`, `styles.css`, `app.js` — frontend.
- `functions/api/` — Pages Function API routes.
- `functions/games/` — R2-backed game file delivery.
- `functions/_lib/auth.js` — signed admin sessions.
- `migrations/` — D1 schema migrations.
- `catalog/` — catalogue seed data / future import metadata.
- `wrangler.toml` — Cloudflare bindings.

## Current deployment status

Source code is committed to GitHub, but this does not mean the Cloudflare resources have been created or the site has been deployed. Before launch, configure D1, R2 and the two Pages secrets, apply the migration, then test admin login, uploads, game playback and chat on the deployed hostname.
