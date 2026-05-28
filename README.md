# Smart Parking Availability Predictor

A professional SaaS-style landing website for an AI-powered smart parking availability predictor. The site is built with Next.js, TypeScript, and Tailwind CSS, using a responsive blue/navy design system and reusable UI components.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Database
- ESLint

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Then add your Supabase project URL and keys:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Run the development server:

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Project Structure

```text
app/                Next.js pages, API routes, auth callback, layout, and styles
components/         Reusable sections and UI components
lib/                Shared data, Supabase clients, and database types
services/           Parking, booking, prediction, and auth service modules
```

## Supabase Integration

- `supabase/schema.sql` contains the paste-ready SQL schema for Supabase SQL Editor.
- `lib/supabaseClient.ts` creates a browser Supabase client for client components.
- `lib/supabaseServer.ts` creates request-scoped server clients and a server-only admin client.
- `app/auth/callback/route.ts` handles Supabase Auth redirects safely.
- `app/login`, `app/register`, and `app/dashboard` provide Supabase Auth flows and a protected dashboard.
- `app/parking/search` provides a real Supabase-powered parking search experience with loading, empty, and error states.
- `app/bookings` lets authenticated users reserve live available slots and view only their own bookings.
- `app/admin` provides an admin-only dashboard for booking overview and parking management.
- API routes include `GET /api/parking/areas`, `GET /api/parking/areas/:id`, `GET|POST /api/bookings`, rule-based `GET|POST /api/predictions`, and admin-only booking/parking management routes under `/api/admin`.
- `POST /api/predictions` estimates availability from time of day, weekday/weekend, current available slots, and total slots, then stores each request in Supabase.
- Service modules accept an optional Supabase client, so server routes/actions can inject the server client while browser flows can use the browser client.
