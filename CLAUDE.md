# SQL Practice & Assessment Platform — CLAUDE.md

## What This Project Is
An interactive SQL practice and assessment platform for institutes, bootcamps, and universities.
Replaces the manual workflow of sharing datasets in Excel and verifying queries by hand.

## Two Modes
- **Practice Mode** — students write SQL, get instant correct/incorrect feedback, unlimited attempts
- **Assessment Mode** — timed exam, SQL runs but correct/incorrect hidden until submission

## Tech Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- App DB: Turso / libSQL via @libsql/client (async `getAppDb()` in /lib/db.ts), no ORM
- Dataset DBs: better-sqlite3, opened read-only (no ORM)
- Monaco Editor (@monaco-editor/react)
- Zod (validation)

## Folder Structure
- /app/page.tsx — student question list (home)
- /app/questions/[id]/page.tsx — practice SQL editor
- /app/assessment/ — student assessment pages (join, take, result)
- /app/admin/ — instructor dashboard (questions, assessments, attempts)
- /app/api/questions/ — GET questions (no solution_sql exposed)
- /app/api/execute/ — POST: run + grade SQL (practice mode)
- /app/api/assessment/ — join, run, submit APIs
- /app/api/admin/ — all admin APIs (protected)
- /app/api/datasets/[name]/schema — public GET: table + column names of a dataset (read-only, no data). Used by components/SchemaReference.tsx on practice and assessment pages
- /lib/db.ts — Turso (libSQL) connection + schema init
- /lib/executor.ts — core grading engine (runs student + solution SQL)
- /lib/comparator.ts — result set comparison logic
- /lib/auth.ts — HMAC-signed session tokens (Web Crypto; used by middleware + routes)
- /lib/site.ts — site name, owner, contact email, location (used by legal pages/footer)
- /app/privacy, /app/terms, /app/contact — legal pages (DPDP Act 2023 aware); /app/not-found.tsx, /app/error.tsx, /app/global-error.tsx
- /components/GuidedTour.tsx — first-time tour (data-tour="..." targets); started from home via /questions/<id>?tour=1
- /data/datasets/ — dataset .db files (ecommerce.db exists)
- /scripts/seed.ts — seeds questions and ecommerce dataset
- /types/index.ts — all shared TypeScript types
- /middleware.ts — protects /admin/* pages AND /api/admin/* APIs; per-IP rate limiting

## Database Tables
- questions — title, description, difficulty, dataset_name, solution_sql (hidden), order_matters
- attempts — every student run in practice mode, logged as 'anonymous'
- assessments — title, access_code, time_limit_mins, is_active
- assessment_questions — links assessments to questions
- assessment_submissions — student name, score, submitted_at
- assessment_answers — per-question SQL and is_correct per submission

## Grading Logic
- Student SQL and solution SQL both run against the same dataset .db file
- Results compared value-by-value (not SQL-to-SQL)
- If outputs match → Correct
- Dataset opened READ-ONLY to prevent destructive queries
- solution_sql is NEVER sent to the client

## Security Model
- Admin login: password compared in constant time against ADMIN_PASSWORD; cookie `admin_token` holds a signed token (never the password), httpOnly, sameSite=strict, 8h
- Signing secret: SESSION_SECRET, falling back to ADMIN_PASSWORD (changing either logs everyone out)
- /middleware.ts: /admin/* pages redirect to login, /api/admin/* (except login/logout) return 401 without a valid token
- Rate limits (in-memory per IP, reset on restart, single-instance only): login 5/15min, execute + assessment/run 30/min (shared), assessment/join 10/min
- Assessment sessions: join sets signed httpOnly cookie `assessment_session`; run/submit/result reject a submission_id that doesn't match it
- Query execution: executor runs student + solution SQL in a child process, SIGKILLed after 5s, 128MB heap cap, max 3 concurrent (queue 20). executeAndGrade is async
- Security headers + CSP in next.config.mjs (CSP allows cdn.jsdelivr.net for Monaco)
- CSRF: cookies are SameSite=strict, and middleware rejects non-GET /api requests whose Origin header is a different host

## Current Build Status
### Done
- Phase 1: Project scaffold, grading engine, seed data, student SQL editor UI
- Phase 2A: Instructor dashboard (question CRUD, attempt logs, stats)
- Phase 2C: Assessment mode (create, join, take, submit, results)

### In Progress
- Phase 2B: Multiple dataset upload (instructor can upload custom .db files)

### Planned
- Student auth (login/signup)
- Progress tracking per student
- AI hints in practice mode
- Export attempts as CSV

## Key Rules — Never Break These
- NEVER expose solution_sql in any API response to the client
- NEVER open dataset .db files in write mode — always readonly
- NEVER use an ORM — raw SQL only (we are a SQL platform)
- NEVER add dependencies without checking with the PM first
- Every new /api/admin/* route is protected by middleware automatically. Do not move admin APIs elsewhere
- Any new route that runs student SQL must go through executeAndGrade (timeout) and be added to the rate limits in middleware.ts
- Do NOT modify /lib/executor.ts or /lib/comparator.ts without explicit instruction
- Do NOT modify /app/api/execute/route.ts or /app/api/questions/route.ts without explicit instruction

## Running the Project
- npm run dev — start dev server (localhost:3000)
- npm run seed — SAFE seed, runs on every Render deploy: creates missing tables/dataset/demo questions, never deletes (uses real env vars)
- npm run seed:turso — same safe seed locally, using .env.local
- npm run seed:reset — DESTRUCTIVE: wipes all questions, attempts, assessments, submissions (local, .env.local). Never use in a deploy step
- NOTE: local .env.local points at the PRODUCTION Turso DB
- Admin login — localhost:3000/admin/login (password: ADMIN_PASSWORD from .env.local)
- Student practice — localhost:3000
- Student assessment — localhost:3000/assessment
