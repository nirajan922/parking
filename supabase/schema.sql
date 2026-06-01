-- Smart Parking Availability Predictor schema for Supabase.
-- Paste this file into the Supabase SQL Editor and run it once per project.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'parking_area_status') then
    create type public.parking_area_status as enum ('open', 'busy', 'full', 'maintenance');
  end if;

  if not exists (select 1 from pg_type where typname = 'parking_slot_status') then
    create type public.parking_slot_status as enum ('available', 'occupied', 'reserved', 'maintenance');
  end if;

  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'expired');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parking_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  source text not null default 'manual',
  external_id text,
  total_slots integer not null default 0 check (total_slots >= 0),
  status public.parking_area_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create table if not exists public.parking_slots (
  id uuid primary key default gen_random_uuid(),
  parking_area_id uuid not null references public.parking_areas(id) on delete cascade,
  slot_number text not null,
  level text,
  status public.parking_slot_status not null default 'available',
  is_accessible boolean not null default false,
  has_ev_charger boolean not null default false,
  hourly_rate numeric(10, 2) not null default 0 check (hourly_rate >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parking_area_id, slot_number)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parking_area_id uuid not null references public.parking_areas(id) on delete restrict,
  parking_slot_id uuid not null references public.parking_slots(id) on delete restrict,
  vehicle_plate text not null check (vehicle_plate ~ '^[A-Z0-9 -]{2,16}$'),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'pending',
  total_price numeric(10, 2) not null default 0 check (total_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  parking_area_id uuid not null references public.parking_areas(id) on delete cascade,
  predicted_available_slots integer not null check (predicted_available_slots >= 0),
  confidence_score numeric(5, 4) not null check (confidence_score >= 0 and confidence_score <= 1),
  prediction_window_start timestamptz not null,
  prediction_window_end timestamptz not null,
  model_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (prediction_window_end > prediction_window_start)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.parking_areas add column if not exists source text not null default 'manual';
alter table public.parking_areas add column if not exists external_id text;
create unique index if not exists parking_areas_source_external_id_uidx
on public.parking_areas(source, external_id)
where external_id is not null;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists parking_areas_slug_idx on public.parking_areas(slug);
create index if not exists parking_areas_source_external_idx on public.parking_areas(source, external_id);
create index if not exists parking_slots_area_status_idx on public.parking_slots(parking_area_id, status);
create index if not exists bookings_user_start_idx on public.bookings(user_id, start_time desc);
create index if not exists bookings_slot_window_idx on public.bookings(parking_slot_id, start_time, end_time);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists predictions_area_created_idx on public.predictions(parking_area_id, created_at desc);
create index if not exists contact_messages_created_idx on public.contact_messages(created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_parking_areas_updated_at on public.parking_areas;
create trigger set_parking_areas_updated_at
before update on public.parking_areas
for each row execute function public.set_updated_at();

drop trigger if exists set_parking_slots_updated_at on public.parking_slots;
create trigger set_parking_slots_updated_at
before update on public.parking_slots
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = required_role
  );
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
    and auth.role() <> 'service_role'
    and not public.has_role('admin')
    and exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'Only admins can change profile roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.prevent_unsafe_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.has_role('admin') then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'Users can update only their own bookings.';
  end if;

  if new.user_id <> old.user_id
    or new.parking_area_id <> old.parking_area_id
    or new.parking_slot_id <> old.parking_slot_id
    or new.vehicle_plate <> old.vehicle_plate
    or new.start_time <> old.start_time
    or new.end_time <> old.end_time
    or new.total_price <> old.total_price then
    raise exception 'Users can only cancel their bookings.';
  end if;

  if old.status not in ('pending', 'confirmed') or new.status <> 'cancelled' then
    raise exception 'Only pending or confirmed bookings can be cancelled by users.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unsafe_booking_update on public.bookings;
create trigger prevent_unsafe_booking_update
before update on public.bookings
for each row execute function public.prevent_unsafe_booking_update();

alter table public.profiles enable row level security;
alter table public.parking_areas enable row level security;
alter table public.parking_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.predictions enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "Profiles are readable by owner or admins" on public.profiles;
create policy "Profiles are readable by owner or admins"
on public.profiles for select
using (id = auth.uid() or public.has_role('admin'));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists "Parking areas are publicly readable" on public.parking_areas;
create policy "Parking areas are publicly readable"
on public.parking_areas for select
using (true);

drop policy if exists "Admins can manage parking areas" on public.parking_areas;
create policy "Admins can manage parking areas"
on public.parking_areas for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists "Parking slots are publicly readable" on public.parking_slots;
create policy "Parking slots are publicly readable"
on public.parking_slots for select
using (true);

drop policy if exists "Admins can manage parking slots" on public.parking_slots;
create policy "Admins can manage parking slots"
on public.parking_slots for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists "Users can read their own bookings" on public.bookings;
create policy "Users can read their own bookings"
on public.bookings for select
using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists "Users can create their own bookings" on public.bookings;
create policy "Users can create their own bookings"
on public.bookings for insert
with check (user_id = auth.uid());

drop policy if exists "Users can cancel their own bookings" on public.bookings;
create policy "Users can cancel their own bookings"
on public.bookings for update
using (user_id = auth.uid())
with check (user_id = auth.uid() and status = 'cancelled');

drop policy if exists "Admins can manage bookings" on public.bookings;
create policy "Admins can manage bookings"
on public.bookings for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists "Predictions are publicly readable" on public.predictions;
create policy "Predictions are publicly readable"
on public.predictions for select
using (true);

drop policy if exists "Admins can manage predictions" on public.predictions;
create policy "Admins can manage predictions"
on public.predictions for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists "Anyone can create contact messages" on public.contact_messages;
create policy "Anyone can create contact messages"
on public.contact_messages for insert
with check (true);

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages for select
using (public.has_role('admin'));

grant usage on schema public to anon, authenticated;
grant select on public.parking_areas, public.parking_slots, public.predictions to anon;
grant insert on public.contact_messages to anon, authenticated;
grant all on public.profiles, public.parking_areas, public.parking_slots, public.bookings, public.predictions, public.contact_messages to authenticated;
grant all on public.profiles, public.parking_areas, public.parking_slots, public.bookings, public.predictions, public.contact_messages to service_role;
