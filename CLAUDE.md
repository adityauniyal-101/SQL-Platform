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
- better-sqlite3 (SQLite, no ORM)
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
- /lib/db.ts — SQLite connection + schema init
- /lib/executor.ts — core grading engine (runs student + solution SQL)
- /lib/comparator.ts — result set comparison logic
- /data/app.db — app database (auto-created)
- /data/datasets/ — dataset .db files (ecommerce.db exists)
- /scripts/seed.ts — seeds questions and ecommerce dataset
- /types/index.ts — all shared TypeScript types
- /middleware.ts — protects /admin/* routes

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

## Admin Auth
- Simple cookie-based auth
- Password stored in .env.local as ADMIN_PASSWORD=admin123
- /middleware.ts protects all /admin/* routes
- Cookie name: admin_token

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
- Deploy to Vercel/Railway

## Key Rules — Never Break These
- NEVER expose solution_sql in any API response to the client
- NEVER open dataset .db files in write mode — always readonly
- NEVER use an ORM — raw SQL only (we are a SQL platform)
- NEVER add dependencies without checking with the PM first
- Do NOT modify /lib/executor.ts or /lib/comparator.ts without explicit instruction
- Do NOT modify /app/api/execute/route.ts or /app/api/questions/route.ts without explicit instruction

## Running the Project
- npm run dev — start dev server (localhost:3000)
- npm run seed — seed questions and ecommerce dataset
- Admin login — localhost:3000/admin/login (password: admin123)
- Student practice — localhost:3000
- Student assessment — localhost:3000/assessment
