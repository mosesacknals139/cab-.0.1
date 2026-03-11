# Contributing Guide

Thanks for contributing. This document explains how to make changes that are easy to review and safe to ship.

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local` (see [`README.md`](./README.md)).

3. Ensure Supabase schema is applied from [`supabase-schema.sql`](./supabase-schema.sql).

4. Start local server:

```bash
npm run dev
```

## Branch and Commit Conventions

- Create feature branches from `main`.
- Recommended branch naming:
  - `feat/<short-name>`
  - `fix/<short-name>`
  - `docs/<short-name>`
- Prefer small, focused commits.
- Recommended commit style (conventional format):
  - `feat: add rider timeout for ride request`
  - `fix: handle non-json payment error payload`
  - `docs: update env setup instructions`

## Code Quality Expectations

- Keep TypeScript strict and avoid `any` unless unavoidable.
- Reuse existing helpers/components before introducing new patterns.
- Preserve current UI patterns unless a redesign is intentional.
- Prefer clear error handling for all network and API calls.
- Avoid logging secrets or returning secret values from API routes.

## API and Database Changes

When changing API handlers or DB expectations:

- Update `supabase-schema.sql` if schema/policy changes are required.
- Keep response payloads backward-compatible when possible.
- Add migration/setup notes to `README.md` if needed.

## Local Verification Before PR

Run the following before opening a PR:

```bash
npm run lint
npm run check:supabase
```

Then smoke-test key flows manually:

- Auth flow (`/sign-in`, `/sign-up`)
- Rider flow (`/dashboard`) from request to completion/payment
- Driver flow (`/driver`) accept/start/complete
- Ride history and receipt pages (`/rides`)

## Pull Request Checklist

- PR title is clear and scoped.
- Description explains what changed and why.
- Screenshots/gifs included for UI changes.
- Environment variable or schema changes documented.
- README/CONTRIBUTING updated if behavior changed.

## Reporting Issues

When filing a bug, include:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Browser/device details
- Relevant logs or API error messages

## Security

- Never commit real API keys or credentials.
- If a secret is exposed, rotate it immediately and update impacted environments.
