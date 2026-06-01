# Testing Notes

## Automated checks

Run these before submission:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm test` currently runs lint and TypeScript checks as a lightweight smoke test.

## Manual assessment test cases

Capture screenshots for each successful step.

1. Home page
   - Open `/`.
   - Confirm the landing page, features, how-it-works section, and dashboard preview render on desktop and mobile width.

2. Authentication
   - Open `/login`.
   - Sign in with a real Supabase user, or use the demo credentials:
     - Email: `demo@smartparking.com`
     - Password: `Demo12345`
   - Confirm `/dashboard` opens.

3. OSM search to Supabase import
   - Open `/parking/search`.
   - Search a city or use a preset.
   - Click `Book Now`.
   - Confirm the app saves/imports the OSM parking area and redirects to `/bookings?areaId=<uuid>&slotId=<uuid>`.

4. Persistent booking
   - Complete the booking form.
   - Use demo card details such as `4242 4242 4242 4242`, `12/30`, `123`.
   - Confirm success screen.
   - Open `/my-bookings` and verify the booking appears.

5. Booking cancellation
   - On `/my-bookings`, click `Cancel Booking`.
   - Confirm status changes to `cancelled`.
   - Verify the related slot is released in Supabase.

6. Prediction evidence
   - Open `/dashboard`.
   - Select a parking area and date/time.
   - Click `Generate`.
   - Confirm the baseline forecast message appears and a row is saved in `public.predictions`.

7. Dashboard API
   - With a signed-in Supabase user, open `/api/dashboard`.
   - Confirm totals, availability, active bookings, recent predictions, and confidence values are returned.

8. Contact persistence
   - Open `/contact`.
   - Submit the form.
   - Confirm a row is saved in `public.contact_messages`.

## Expected screenshots for final report

- Landing page first viewport.
- Search results after an OSM search.
- Booking form with imported UUID parameters in the URL.
- Booking success receipt.
- My Bookings page showing confirmed/cancelled statuses.
- Dashboard summary and generated baseline prediction.
- Supabase tables showing seeded/imported rows.
