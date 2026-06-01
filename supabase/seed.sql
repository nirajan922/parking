-- Smart Parking Availability Predictor seed data.
-- Run supabase/schema.sql first, then run this file in the Supabase SQL Editor.
-- Demo login in the app uses localStorage and does not require an auth.users row.
-- To make a real admin, create a Supabase Auth user, then update public.profiles.role = 'admin'.

insert into public.parking_areas (
  id,
  name,
  slug,
  description,
  address,
  latitude,
  longitude,
  source,
  external_id,
  total_slots,
  status
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'Campus Central Garage',
    'campus-central-garage',
    'Seeded multi-level garage used for assessment booking and prediction evidence.',
    'Campus Main Road',
    -33.8708000,
    151.2087000,
    'seed',
    'seed-campus-central',
    36,
    'open'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Riverside Station Parking',
    'riverside-station-parking',
    'Seeded commuter parking area with moderate demand.',
    'Riverside Station Entrance',
    -33.8614000,
    151.2114000,
    'seed',
    'seed-riverside-station',
    24,
    'busy'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Market Square Car Park',
    'market-square-car-park',
    'Seeded city-centre parking area for dashboard summaries.',
    'Market Square',
    -33.8752000,
    151.2008000,
    'seed',
    'seed-market-square',
    18,
    'open'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  source = excluded.source,
  external_id = excluded.external_id,
  total_slots = excluded.total_slots,
  status = excluded.status,
  updated_at = now();

insert into public.parking_slots (
  parking_area_id,
  slot_number,
  level,
  status,
  is_accessible,
  has_ev_charger,
  hourly_rate
)
select
  '11111111-1111-4111-8111-111111111111',
  'C-' || gs,
  'Level ' || ceil(gs / 12.0)::int,
  case when gs in (5, 9, 14, 21, 28) then 'occupied'::public.parking_slot_status else 'available'::public.parking_slot_status end,
  gs = 1,
  gs in (2, 3),
  7.50
from generate_series(1, 36) as gs
on conflict (parking_area_id, slot_number) do update set
  level = excluded.level,
  status = excluded.status,
  is_accessible = excluded.is_accessible,
  has_ev_charger = excluded.has_ev_charger,
  hourly_rate = excluded.hourly_rate,
  updated_at = now();

insert into public.parking_slots (
  parking_area_id,
  slot_number,
  level,
  status,
  is_accessible,
  has_ev_charger,
  hourly_rate
)
select
  '22222222-2222-4222-8222-222222222222',
  'R-' || gs,
  null,
  case when gs in (2, 4, 6, 8, 10, 12, 15) then 'occupied'::public.parking_slot_status else 'available'::public.parking_slot_status end,
  gs = 1,
  gs = 2,
  5.25
from generate_series(1, 24) as gs
on conflict (parking_area_id, slot_number) do update set
  status = excluded.status,
  is_accessible = excluded.is_accessible,
  has_ev_charger = excluded.has_ev_charger,
  hourly_rate = excluded.hourly_rate,
  updated_at = now();

insert into public.parking_slots (
  parking_area_id,
  slot_number,
  level,
  status,
  is_accessible,
  has_ev_charger,
  hourly_rate
)
select
  '33333333-3333-4333-8333-333333333333',
  'M-' || gs,
  null,
  case when gs in (3, 7, 11) then 'occupied'::public.parking_slot_status else 'available'::public.parking_slot_status end,
  gs = 1,
  false,
  6.00
from generate_series(1, 18) as gs
on conflict (parking_area_id, slot_number) do update set
  status = excluded.status,
  is_accessible = excluded.is_accessible,
  has_ev_charger = excluded.has_ev_charger,
  hourly_rate = excluded.hourly_rate,
  updated_at = now();

insert into public.predictions (
  parking_area_id,
  predicted_available_slots,
  confidence_score,
  prediction_window_start,
  prediction_window_end,
  model_version,
  metadata
) values
  (
    '11111111-1111-4111-8111-111111111111',
    24,
    0.84,
    now() + interval '1 hour',
    now() + interval '2 hours',
    'baseline-rule-v1-seed',
    '{"source":"seed","availabilityLevel":"high","ruleContext":{"timeSegment":"standard","isWeekend":false}}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    10,
    0.78,
    now() + interval '2 hours',
    now() + interval '3 hours',
    'baseline-rule-v1-seed',
    '{"source":"seed","availabilityLevel":"medium","ruleContext":{"timeSegment":"evening_peak","isWeekend":false}}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    6,
    0.74,
    now() + interval '3 hours',
    now() + interval '4 hours',
    'baseline-rule-v1-seed',
    '{"source":"seed","availabilityLevel":"low","ruleContext":{"timeSegment":"midday","isWeekend":true}}'::jsonb
  );

insert into public.contact_messages (
  full_name,
  email,
  subject,
  message
) values (
  'Assessment Reviewer',
  'reviewer@example.com',
  'Seed contact message',
  'This seeded message proves the contact form has a persistent Supabase table.'
);
