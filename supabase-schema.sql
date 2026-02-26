-- =========================================
-- Uber Clone: Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =========================================

-- 1. Profiles Table (synced with Clerk users)
create table if not exists public.profiles (
  id text primary key,   -- Clerk user ID
  full_name text,
  email text,
  phone_number text,
  avatar_url text,
  role text not null default 'rider' check (role in ('rider', 'driver')),
  created_at timestamptz not null default now()
);

-- 2. Rides Table
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  rider_id text not null references public.profiles(id) on delete cascade,
  driver_id text references public.profiles(id) on delete set null,
  pickup_location text not null,
  dropoff_location text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  fare numeric(10, 2),
  status text not null default 'requested' check (status in ('requested', 'accepted', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- =========================================
-- Row Level Security (RLS)
-- =========================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.rides enable row level security;

-- Profiles: users can read/write their own profile
create policy "Users can view own profile" on public.profiles
  for select using (id = requesting_user_id());

create policy "Users can update own profile" on public.profiles
  for update using (id = requesting_user_id());

-- Profiles: allow inserts from API routes (using service role)
create policy "Allow profile upsert from server" on public.profiles
  for insert with check (true);

-- Rides: riders can insert their own rides
create policy "Riders can create rides" on public.rides
  for insert with check (rider_id = requesting_user_id());

-- Rides: riders and drivers can view their own rides
create policy "Users can view relevant rides" on public.rides
  for select using (
    rider_id = requesting_user_id() or
    driver_id = requesting_user_id() or
    status = 'requested'   -- drivers can see all open requests
  );

-- Rides: drivers can update rides (to accept/complete)
create policy "Drivers can update rides" on public.rides
  for update using (
    driver_id = requesting_user_id() or
    driver_id is null
  );

-- =========================================
-- Realtime Publication
-- =========================================
-- Allow Supabase Realtime to broadcast ride changes
alter publication supabase_realtime add table public.rides;

-- =========================================
-- 3. Add payment columns to rides
-- =========================================
alter table public.rides
  add column if not exists payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  add column if not exists payment_intent_id text;

-- =========================================
-- 4. Ratings Table
-- =========================================
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  rider_id text not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  tags text[],
  created_at timestamptz not null default now()
);

alter table public.ratings enable row level security;

create policy "Riders can insert their own ratings" on public.ratings
  for insert with check (rider_id = requesting_user_id());

create policy "Ratings are publicly readable" on public.ratings
  for select using (true);

alter publication supabase_realtime add table public.ratings;
