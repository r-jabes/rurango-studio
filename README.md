# Rurango Studio

Internal business management application for RURANGO. Deploy on a dedicated subdomain (e.g. `studio.rurango.com`). The public portfolio in `../web` stays separate.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (RURANGO brand tokens)
- PostgreSQL + Drizzle ORM
- Better Auth (email/password + optional MFA; public signup disabled)
- Vitest unit tests; optional Playwright smoke

## Setup

1. Copy `.env.example` to `.env.local` and fill values.
2. Create a PostgreSQL database.
3. Install and migrate:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Dev server defaults to port **3001** so it does not collide with the portfolio on 3000.

### Seed (development only)

`npm run db:seed` requires `APP_ENV=development` plus:

- `SEED_OWNER_EMAIL`
- `SEED_OWNER_PASSWORD` (12+ characters)
- optional `SEED_OWNER_NAME`

Do not use real client data in seeds.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local app on port 3001 |
| `npm run build` / `start` | Production build |
| `npm run lint` / `typecheck` | Quality checks |
| `npm test` | Vitest unit suite |
| `npm run test:e2e` | Playwright smoke (needs `STUDIO_E2E_BASE_URL`) |
| `npm run check` | typecheck + lint + test |
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Dev-only owner + company settings |

## Documentation

- `docs/RELEASE.md` — deploy and release checklist
- `docs/RECOVERY.md` — backups and restore drills
- `../docs/09-RURANGO-STUDIO-IMPLEMENTATION-PLAN.md` — architecture and phases

## Current status

Phases **1–8** are implemented: CRM, vault, commercial docs, finance/delivery, CMS publish path, MFA/rate limits/backups, and hardening tests + release docs.

Portfolio integrity: Studio never serves vault files from `web/public`. CMS content reaches the portfolio only through the authenticated public content API and the portfolio `content:pull` job.
