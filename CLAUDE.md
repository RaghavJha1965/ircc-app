# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IRCC Immigration Tracker — a Next.js app for Canadian immigration applicants to track Express Entry draws, calculate CRS scores, manage PR document checklists, and receive Telegram/email notifications about new draws.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (v9, flat config)
```

Prisma commands:
```bash
npx prisma generate          # Regenerate Prisma client
npx prisma migrate dev       # Run migrations (local SQLite)
npx prisma studio            # Browse database GUI
```

## Architecture

**Stack:** Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS 4, Prisma 7 + Turso/LibSQL, shadcn/ui (New York style, RSC-enabled)

**Database:** SQLite locally (`prisma/dev.db`), Turso in production. Prisma client uses `@libsql/client` adapter (`src/lib/db.ts`). Single-user app — Settings and CrsProfile use a single row with `id: "default"`.

**Key data flow:** Hourly cron (`/api/cron/monitor`) scrapes IRCC website via Cheerio → detects new draws → saves to DB → sends Telegram/email notifications. Cron is triggered externally (cron-job.org) and authenticated with Bearer token (`CRON_SECRET`).

### API Routes (`src/app/api/`)

| Route | Purpose |
|---|---|
| `draws/` | GET/POST Express Entry draws (supports `?refresh=true` to re-scrape) |
| `crs-profile/` | GET/POST CRS calculator profile |
| `documents/` | GET/POST/DELETE PR document checklist |
| `settings/` | GET/POST notification & alert settings |
| `cron/monitor/` | Hourly scrape + notification job |
| `test-notification/` | Test Telegram/email delivery |

All API routes use `force-dynamic` (no caching). Responses are JSON via `NextResponse`.

### Key Libraries (`src/lib/`)

- **`scraper.ts`** — Cheerio-based IRCC website scraper with 1-hour cache
- **`crs-calculator.ts`** — Full CRS scoring grid (IELTS→CLB conversion, age tables, skill transferability matrix, 1200 max points)
- **`telegram.ts`** / **`email.ts`** — HTML-formatted notification senders (Telegram Bot API, Resend)
- **`db.ts`** — Prisma singleton with Turso adapter
- **`utils.ts`** — `cn()` helper (clsx + tailwind-merge)

### Frontend Pages (`src/app/`)

- `/` — Dashboard with draw history, stats, and trends (Recharts)
- `/calculator` — Interactive CRS score calculator with detailed breakdown
- `/checklist` — PR document tracker (15 default docs across 6 categories)
- `/settings` — Telegram/email config, alert thresholds, toggles

All pages are client components (`"use client"`) using useState/useEffect for data fetching. Layout is a server component with navigation.

### Prisma Schema (`prisma/schema.prisma`)

7 models: Draw, PnpDraw, News, Document, Settings, CrsProfile, ProcessingTime. IDs use `@default(cuid())`. Complex fields (language scores, etc.) stored as JSON strings.

## Environment Variables

`DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CRON_SECRET`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL`

## Conventions

- Path alias: `@/*` → `./src/*`
- Upsert pattern used for idempotent DB operations (draws, settings, profiles)
- Default documents and profiles auto-initialize on first access
- Theming via CSS variables (HSL), primary color `#d7406d`, dark mode supported
- Production deploys to Vercel; cron configured in `vercel.json`
