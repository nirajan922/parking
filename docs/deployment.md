# Deployment Notes

## Required services

- Vercel or another Next.js host.
- Supabase project with Auth and PostgreSQL enabled.

## Environment variables

Set these in local `.env.local` and in the hosting provider:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or screenshots.

## Supabase setup

1. Open Supabase SQL Editor.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Create at least one Supabase Auth user for real login testing.
5. To make an admin user, run this after the user exists:

```sql
update public.profiles
set role = 'admin'
where id = '<auth-user-id>';
```

## Vercel setup

1. Import the repository into Vercel.
2. Add the environment variables above.
3. Use the default build command:

```bash
npm run build
```

4. Deploy.

The app uses a system font stack, so the production build does not need to fetch Google Fonts.

## Prototype limitations to disclose

- Prediction is a baseline rule-based engine, not a trained ML model.
- OSM provides parking location discovery; availability and imported slots are generated for prototype evidence.
- Demo login uses browser storage and is for assessment walkthroughs only.
- Payment is simulated and does not process real money.
