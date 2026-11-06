# excruciating

A self-hosted HTML5 browser game library designed to run on Cloudflare's free services.

## Features

- Minimal black-and-white game catalogue with square thumbnails, search and categories.
- Same-origin game player with reload and fullscreen controls.
- Public username-based chat with timestamps and basic rate limiting.
- Password-protected `/admin` dashboard with signed, HttpOnly admin sessions.
- Game catalogue management and chat moderation.
- Game source, licence and attribution metadata required before publishing.

## Free hosting architecture

- Cloudflare Pages serves the website and game files directly from this GitHub repository.
- Cloudflare Pages Functions provide the API and admin routes.
- Cloudflare D1 stores the catalogue and chat messages.
- No R2 bucket, paid storage service, or third-party game embed is required.

Cloudflare's free-plan quotas and limits apply. Keep game files within the Pages limits (including the per-file size limit). Do not add large game archives or unnecessary assets to the repository.

## Cloudflare setup

1. Create a Cloudflare Pages project named `excruciating` and connect this GitHub repository. Use the repository root (`.`) as the build output directory; there is no build command.
2. Create the D1 database if it does not already exist:
   ```sh
   npx wrangler d1 create excruciating
   ```
   The current `wrangler.toml` contains the configured database ID. If you create a different database, replace it with that database's ID.
3. Apply the schema to the remote D1 database:
   ```sh
   npx wrangler d1 migrations apply excruciating --remote
   ```
4. Set the two secrets on the Pages project. Use a long, unique password and a separately generated random session secret:
   ```sh
   npx wrangler pages secret put ADMIN_PASSWORD --project-name excruciating
   npx wrangler pages secret put SESSION_SECRET --project-name excruciating
   ```
5. Deploy from the connected GitHub repository, or use:
   ```sh
   npx wrangler pages deploy . --project-name excruciating
   ```

Do not commit passwords, session secrets, API tokens or account credentials. The admin page is at `/admin`; there is intentionally no public admin link.

## Adding games

Games are hosted as ordinary static files in this repository. Add each cleared game under:

```text
games/<slug>/index.html
games/<slug>/...other game files...
```

The game folder must contain an `index.html` at its root. Keep relative asset paths intact. Commit and push the files to GitHub, then wait for Cloudflare Pages to deploy. After the deployed game URL `/games/<slug>/index.html` is available, sign in at `/admin` and add its catalogue metadata. The admin form checks that the game entry point exists before publishing it.

To remove a game from the catalogue, use the admin dashboard. Its static files remain in GitHub until you delete the corresponding `games/<slug>/` folder from the repository.

For each game, the admin form requires:
- The original source URL.
- The applicable licence name or a clear description of the permission obtained.
- Attribution details where required.

Only publish games when the licence or rights-holder permission permits self-hosting and redistribution. A game appearing in an archive is not proof that it can be copied. Keep required copyright and attribution notices with the game files. The initial catalogue contains 48 HTML5 games copied from `mashukui/web-games`, a repository distributed under the MIT License. Their source pages, shared `i18n.js` runtime, upstream licence text and attribution are included under `games/`. The games are seeded into D1 by migration `0002_seed_games.sql`. Review and test each game on the deployed site before treating it as production-ready.

## Chat

Visitors choose a display name; no visitor account is required. Messages are stored in D1. The backend limits bursts of messages, and admins can delete messages from the dashboard. Usernames are not verified identities.

## Project structure

- `index.html`, `styles.css`, `app.js` — frontend.
- `functions/api/` — Pages Function API routes.
- `functions/_lib/auth.js` — signed admin sessions.
- `migrations/` — D1 schema migrations.
- `games/` — self-hosted static HTML5 game files.
- `catalog/` — catalogue seed data / import metadata.
- `wrangler.toml` — Cloudflare D1 binding.

## Deployment status

Source code is committed to GitHub, but this does not mean Cloudflare has deployed it or configured the D1 migration and secrets. Test admin login, catalogue publishing, game playback and chat on the deployed hostname before treating the site as live.
