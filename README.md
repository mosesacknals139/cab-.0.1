# Uber Clone (Cab)

A full-stack ride booking app built with Next.js App Router, Clerk auth, Supabase, Leaflet maps, and Razorpay payments.

## Overview

This project includes two core experiences:

- Rider app: request rides, track live status, and complete payments.
- Driver app: accept nearby requests, start trips, complete rides, and view earnings.

## Key Features

- Clerk authentication (`/sign-in`, `/sign-up`)
- Rider dashboard with pickup/drop selection and fare estimation
- Leaflet map with route preview (OSRM) and reverse geocoding (Nominatim)
- Ride lifecycle tracking: `requested -> accepted -> ongoing -> completed`
- Driver dashboard with polling-based dispatch and earnings stats
- Razorpay checkout and server-side payment confirmation
- Supabase-backed profiles, rides, and ratings
- Demo auto-progress fallback (non-production by default)

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: React 19, Tailwind CSS, Framer Motion, Lucide Icons
- Auth: Clerk
- Database/API: Supabase (Postgres)
- Maps: Leaflet + OpenStreetMap + OSRM
- Payments: Razorpay

## Project Structure

```text
src/
  app/
    (auth)/sign-in, sign-up
    dashboard/         # rider flow
    driver/            # driver flow
    rides/             # ride history + receipt + rating
    api/               # route handlers (ride, driver, payment, ratings)
  components/          # UI components (map, toast, payment modal, etc.)
  lib/                 # supabase clients, currency, demo helpers
  types/               # database and leaflet types
scripts/
  check-supabase.mjs   # validates required tables
supabase-schema.sql    # DB schema and policies
```

## Prerequisites

- Node.js 20+
- npm 10+
- Clerk account
- Supabase project
- Razorpay account (test keys are fine for local)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root and set:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Maps (optional for current Leaflet flow, kept for compatibility)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional: force/disable demo ride auto progression
# true  => always enabled
# false => always disabled
# default => enabled in non-production, disabled in production
ENABLE_DEMO_AUTO_PROGRESS=
```

3. Initialize Supabase schema:

- Open Supabase SQL Editor for your project.
- Run [`supabase-schema.sql`](./supabase-schema.sql).

4. Validate Supabase connectivity:

```bash
npm run check:supabase
```

5. Start dev server:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` - starts local dev server
- `npm run build` - builds production app
- `npm run start` - runs production server
- `npm run lint` - runs ESLint
- `npm run check:supabase` - validates required Supabase tables

## Core Routes

- `/` - landing page
- `/dashboard` - rider dashboard
- `/driver` - driver dashboard
- `/rides` - rider ride history
- `/profile` - user profile

## Troubleshooting

### `SUPABASE_SERVICE_ROLE_KEY is missing in the current runtime`

- Ensure `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` (exact key name).
- Restart dev server after editing env vars.
- If deploying, set the same env var in Vercel project settings and redeploy.

### Rider stuck on "Finding your driver..."

- In non-production, demo auto-progress is enabled by default.
- To force behavior:
  - `ENABLE_DEMO_AUTO_PROGRESS=true` for local demos.
  - `ENABLE_DEMO_AUTO_PROGRESS=false` to require real driver acceptance from `/driver`.

### Supabase table/policy errors

- Re-run [`supabase-schema.sql`](./supabase-schema.sql) in the same project referenced by `NEXT_PUBLIC_SUPABASE_URL`.
- Run `npm run check:supabase` again.

## Security Notes

- Do not commit real secrets in `.env.local`.
- Rotate exposed Clerk, Supabase, Google Maps, and Razorpay keys immediately if leaked.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Contributing

Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development workflow, code quality expectations, and PR checklist.
