# Smart Parking Availability Predictor

Assessment-level full-stack prototype for searching parking, importing OpenStreetMap parking locations into Supabase, booking slots, saving predictions, and viewing dashboard summaries.

## Tech stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- OpenStreetMap Nominatim and Overpass APIs

## Current prototype scope

The app now supports the core workflow:

```text
Search parking -> import/save OSM area -> book slot -> view/cancel booking -> generate baseline prediction -> view dashboard summary
```

Prediction is intentionally implemented as a baseline rule-based engine, not a trained ML model. It uses current slot availability, selected date/time, weekday/weekend, and demand time segment, then stores the result in Supabase.

## Getting started

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the development server:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Create a real Supabase Auth user for login testing.
6. Optional admin role:

```sql
update public.profiles
set role = 'admin'
where id = '<auth-user-id>';
```

`schema.sql` creates:

- `profiles`
- `parking_areas`
- `parking_slots`
- `bookings`
- `predictions`
- `contact_messages`

It also enables Row Level Security policies for user-owned bookings, admin management, public parking reads, public prediction reads, and contact message submission.

## Demo credentials

For assessment walkthroughs without a Supabase Auth user:

- Email: `demo@smartparking.com`
- Password: `Demo12345`

Demo mode uses browser storage. It is useful for UI review but Supabase mode should be used for persistence evidence.

## Main routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/parking/search` | OSM parking search and import-to-Supabase booking handoff |
| `/bookings` | Authenticated booking form with simulated payment |
| `/my-bookings` | User booking history and cancellation |
| `/dashboard` | Authenticated dashboard summary and baseline prediction generator |
| `/admin` | Admin parking and booking overview |
| `/contact` | Contact form stored in Supabase |

## API routes

| Endpoint | Purpose |
|---|---|
| `GET /api/parking/areas` | List Supabase parking areas |
| `GET /api/parking/areas/:id` | Load area and slots |
| `POST /api/parking/import` | Import OSM result into Supabase with generated slots |
| `GET /api/bookings` | List current user bookings |
| `POST /api/bookings` | Create persistent booking |
| `GET /api/bookings/:id` | Load user-owned booking |
| `PATCH /api/bookings/:id` | Cancel user-owned booking |
| `GET /api/predictions` | List stored predictions |
| `POST /api/predictions` | Generate and store baseline prediction |
| `GET /api/dashboard` | Dashboard summary metrics |
| `POST /api/contact` | Store contact message |
| `/api/admin/*` | Admin parking and booking management |

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm test
```

## Documentation

- Testing checklist: `docs/testing.md`
- Deployment steps: `docs/deployment.md`
- Security notes: `SECURITY.md`

## Honest limitations

- No trained ML model or historical dataset pipeline is included yet.
- OSM search discovers real locations, but imported availability/slot details are generated for prototype evidence.
- Payment is simulated.
- Demo login is not production authentication.
