# AGENTS.md

## Project Overview

Smart Parking Availability Predictor — a Next.js 16 (App Router) application with Supabase backend (PostgreSQL + Auth + RLS). Single service architecture: no separate backend needed.

## Cursor Cloud specific instructions

### Services

| Service | Command | Port |
|---------|---------|------|
| Next.js dev server | `npm run dev` | 3000 |
| Supabase (local) | `npx supabase start` | 54321 (API), 54322 (DB), 54323 (Studio), 54324 (Mailpit) |

### Prerequisites (already installed in VM)

- Docker must be running before Supabase: `sudo dockerd &` then wait for socket at `/var/run/docker.sock`
- Docker socket permissions: `sudo chmod 666 /var/run/docker.sock`

### Starting the development environment

1. Start Docker daemon if not running: `sudo dockerd &>/tmp/dockerd.log &` and wait ~5s
2. Fix socket perms: `sudo chmod 666 /var/run/docker.sock`
3. Start Supabase: `npx supabase start` (pulls images on first run; subsequent starts are fast)
4. Apply custom schema: `docker exec -i supabase_db_workspace psql -U postgres -d postgres < supabase/schema.sql`
5. Create `.env.local` from Supabase keys (use `npx supabase status -o json` to get `ANON_KEY`, `SERVICE_ROLE_KEY`, and `API_URL`)
6. Run dev server: `npm run dev`

### Environment variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from npx supabase status -o json → ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<from npx supabase status -o json → SERVICE_ROLE_KEY>
```

### Important gotchas

- The code lives on branch `cursor/smart-parking-website-b7f0`, not `main`. Main only has a README stub.
- `supabase db reset` does NOT apply `supabase/schema.sql` — the schema file must be applied manually via `docker exec`.
- The Supabase local Docker container for the DB is named `supabase_db_workspace`.
- Two containers may be "stopped" after start (`supabase_imgproxy_workspace`, `supabase_pooler_workspace`) — this is normal and doesn't affect functionality.
- Registration emails go to Mailpit at `http://127.0.0.1:54324` for local dev (auto-confirm is enabled by default in Supabase local).

### Commands reference

- **Lint:** `npm run lint` (ESLint with next config)
- **Build:** `npm run build`
- **Dev:** `npm run dev` (binds to 0.0.0.0:3000)
- **No test framework** is configured; lint is the only automated check.
