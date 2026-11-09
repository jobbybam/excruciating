# excruciating

A self-hosted browser-game library deployed from this GitHub repository with Cloudflare Pages.

## Current catalogue

- **Geometry Dash (Scratch)** — a self-hosted Scratch/TurboWarp fan game in `games/geometry-dash/`, with its MIT licence and attribution.
- **14 Papa's restaurant games** — the official Standard Version SWF downloads from Flipline's “Free Games for your Site” programme, hosted locally with the self-hosted Ruffle player. Each folder contains its source/hosting notice.
- **Sound Buttons Space** — https://soundbuttonsspace.com/en/categories (the requested sound-button categories destination).

Only the games listed in the catalogue are displayed. The unrelated generic mini-games and the old bulk-import workflow have been removed.

## Add your own games

Follow [ADDING_GAMES.md](ADDING_GAMES.md). In brief:

1. Check that you created the game, have written permission, or its licence permits redistribution and self-hosting.
2. Put all files in `games/<slug>/`, with `index.html` directly inside that folder.
3. Upload/commit the folder to the `main` branch.
4. After Cloudflare Pages deploys it, sign in at `/admin` and publish the title, category, thumbnail, source URL, licence and attribution.

Keep all relative asset paths working. Do not copy proprietary games or assets just because a browser archive or GitHub repository contains them.

## Cloudflare hosting

- Cloudflare Pages serves the static site and game files from this repository.
- Pages Functions provide the API and admin routes.
- Cloudflare D1 stores the catalogue and chat messages.
- No R2 bucket or paid storage service is used.

The Cloudflare free-plan quotas and file-size limits apply.

## Cloudflare setup

1. Connect this repository to a Cloudflare Pages project named `excruciating`, with root directory `.` and no build command.
2. Create the D1 database if required:
   ```sh
   npx wrangler d1 create excruciating
   ```
3. Apply pending migrations:
   ```sh
   npx wrangler d1 migrations apply excruciating --remote
   ```
4. Set `ADMIN_PASSWORD` and `SESSION_SECRET` as Pages secrets:
   ```sh
   npx wrangler pages secret put ADMIN_PASSWORD --project-name excruciating
   npx wrangler pages secret put SESSION_SECRET --project-name excruciating
   ```

Never commit passwords, session secrets or API tokens. Admin is available at `/admin`; it is intentionally not linked on the public page.

## Deployment status

A GitHub commit does not prove Cloudflare has deployed it or applied D1 migrations. Test game playback, admin publishing and chat on the deployed Pages hostname.
