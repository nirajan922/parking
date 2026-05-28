# Security Notes

This project uses Supabase Auth, Supabase Row Level Security, server-side route checks, and role-based access control to protect user and admin data.

## Authentication checks

- `/dashboard`, `/bookings`, and `/admin` are protected by `proxy.ts`.
- Server pages also validate the Supabase session before rendering protected content.
- API routes that create or read private data call `supabase.auth.getUser()` through service helpers before accessing data.
- Authentication failures return generic `401` responses or redirect to `/login`.

## Role-based access control

- Admin access is based on `public.profiles.role = 'admin'`.
- `/admin` is blocked at the proxy layer unless the current profile is an admin.
- Admin APIs use `requireAdminClient()` / `requireAdminUser()` before returning booking overview or parking management data.
- Normal users cannot access admin dashboard data or admin parking management endpoints.

## Booking ownership

- User booking reads are always filtered by `user_id = auth.uid()` in the service layer.
- `GET /api/bookings/[id]` only returns a booking when it belongs to the authenticated user.
- Booking creation derives `user_id` from the verified Supabase session; clients cannot choose another user ID.
- The SQL schema includes RLS policies so users can read and create only their own bookings.
- Booking updates are restricted by SQL triggers and policies so normal users can only cancel their own pending or confirmed bookings.

## Row Level Security

The paste-ready SQL in `supabase/schema.sql` enables RLS on:

- `profiles`
- `parking_areas`
- `parking_slots`
- `bookings`
- `predictions`

Important policies:

- Profiles are readable by the owner or admins.
- Parking areas, slots, and predictions are publicly readable.
- Bookings are readable by the owner or admins.
- Users can create bookings only for their own `auth.uid()`.
- Admins can manage profiles, parking areas, slots, bookings, and predictions.

RLS is the final database-level protection; API checks are an additional application layer.

## Environment variable protection

- Public browser-safe values must use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be used in client components.
- `.env*.local` is gitignored.
- `.env.example` documents required names without real secret values.
- Admin/service-role writes are isolated to server route handlers and server-only helpers.

## Input validation and safe errors

- API routes validate UUIDs, JSON bodies, date windows, enum values, vehicle plates, slugs, and numeric limits before database writes.
- Admin mutation routes authenticate and authorize admins before processing request bodies.
- Responses use generic messages for configuration/database failures and only return safe validation errors to clients.
- Security headers are configured in `next.config.js` for content type sniffing, framing, referrer behavior, and browser permissions.
