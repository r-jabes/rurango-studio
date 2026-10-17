# Rurango Studio

Internal business management application for RURANGO. Deploy on a dedicated subdomain (e.g. `studio.rurango.com`). The public portfolio in `../web` stays separate.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (RURANGO brand tokens)
- PostgreSQL + Drizzle ORM
- Better Auth (email/password, public signup disabled)

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
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Dev-only owner + company settings |

## Phase 1 status

Working:

- Auth (sign in / sign out), middleware cookie gate, server session checks
- Admin shell (sidebar + top bar)
- Section routes with honest empty states
- Shared UI primitives (forms, table shell, confirm dialog, badges, document preview placeholder)
- DB schema for auth, company settings, audit log stub
- Structured logging with secret scrubbing

Not in Phase 1:

- Client/project CRUD (Phase 2)
- Document vault (Phase 3)
- Commercial documents / finance / CMS / MFA / backups (Phases 4–7)
