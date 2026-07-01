# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Cofrinho — a mobile-first savings-challenge webapp (Next.js App Router + TypeScript). Users create a `caixinha` (a savings goal with a name and a number of days). Each day they draw a random available number 1..total_days representing the R$ amount to deposit, then confirm the deposit. Progress is tracked until all numbers are deposited.

Product/tone context (from README.md): copy should stay direct and human, framed as an alternative to gambling — "less hype, more clarity; less promise, more control." Keep this in mind when touching user-facing copy (all UI text is in Portuguese).

`SPEC.md` is the original technical spec written before implementation. It describes a `better-sqlite3` version of the backend — **the actual implementation uses Supabase/Postgres instead** (see `supabase/schema.sql`, `lib/queries.ts`). Treat SPEC.md as background/product intent (data model shape, business rules, UX flow), not as the source of truth for how data access is implemented.

## Commands

```bash
npm run dev      # start dev server (Next.js)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

There is no test suite configured in this repo.

Environment variables (`.env.local`, see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Database setup: run `supabase/schema.sql` once in the Supabase SQL Editor to create `caixinhas`/`deposits` tables with RLS policies scoped to `auth.uid() = user_id`.

## Architecture

**Data access is centralized in `lib/queries.ts`.** Every operation (list, create, get detail, draw, confirm deposit, undo deposit) lives there as a function taking `(supabase, userId, ...)` and enforcing `user_id` ownership on every query — API routes are thin wrappers that authenticate, validate input, and call these functions. When adding a new caixinha operation, add it to `lib/queries.ts` rather than querying Supabase directly from a route.

Derived stats (`montante_atual`, `montante_previsto`, `dias_pulados`, etc.) are computed at read time in `computeStats()`/`getAvailableNumbers()` in `lib/queries.ts`, not stored — there is no separate migration/cache path to keep in sync when these formulas change.

**Auth** is Supabase Auth (email/password only — no OAuth, no password reset, no email confirmation by design; see SPEC.md "Itens Fora do Escopo"). Two Supabase client constructors exist and are not interchangeable:
- `lib/supabase/client.ts` — browser client, for use in Client Components.
- `lib/supabase/server.ts` — server client bound to Next's cookie store, for use in Server Components, Server Actions, and API routes.

Login/signup/logout are Server Actions in `app/actions/auth.ts` (not API routes).

**Route protection happens in `proxy.ts`**, not in individual pages: it refreshes the Supabase session on every request and redirects unauthenticated users away from any route except `/login` and `/signup`. `/api/*` is excluded from the proxy matcher on purpose — API routes return their own 401 JSON so a `fetch()` call never receives an HTML redirect body; each API route re-checks `supabase.auth.getUser()` itself.

**API routes** (`app/api/caixinhas/...`) follow a consistent shape: check auth → parse/validate params or body → delegate to `lib/queries.ts` → return `NextResponse.json`. Number IDs from route params are parsed with a local `parseId` helper (rejects non-integers) rather than trusting `Number()` directly.

**Client data fetching** uses SWR with the shared `lib/fetcher.ts` fetcher, which throws using the JSON body's `error` field on non-OK responses (API error responses are always `{ error: string }`).

Formatting helpers (`lib/format.ts`) handle BRL currency and pt-BR dates; `formatDate` also normalizes SQLite-style timestamps for compatibility with the legacy SPEC.md format even though the live backend is Postgres/Supabase.

## Working in this Next.js version

Per `AGENTS.md`, this project pins a Next.js version with breaking changes from what training data assumes. Before writing code that touches routing conventions, middleware/proxying, or other framework-level APIs, check `node_modules/next/dist/docs/` for the current convention. One already-encountered example: middleware lives in `proxy.ts` (exporting a `proxy` function), not `middleware.ts`/`middleware`.
