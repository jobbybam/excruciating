# excruciating

A self-hosted HTML5 browser game library.

## Project direction

- Minimal black-and-white interface.
- Search, categories, and square game tiles.
- Dedicated game player with fullscreen and reload controls.
- Locally hosted HTML5 game files in Cloudflare R2.
- Cloudflare Pages frontend, Workers backend, and D1 database.
- Public username-based chat with moderation.
- Secure, separate admin area at `/admin`.
- Domain-independent configuration so the public hostname can change without moving the game library.

## Game licensing

Only import games whose redistribution terms permit self-hosting, or for which permission has been obtained. Preserve required notices and attribution. Track each game's source and licence in the catalogue.

## Planned structure

- `src/` — frontend application
- `functions/` — Pages/Workers API routes
- `public/` — static site assets
- `catalog/` — game metadata and licence records
- `migrations/` — D1 schema migrations
- `wrangler.toml` — Cloudflare configuration

The game payloads themselves will be stored separately in R2, not committed into this repository.
