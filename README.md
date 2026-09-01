# Nadya OS

A prototype personal operating system designed around one principle: **the system should manage the system**.

## Prototype goals

- Show one clear Main Quest instead of a giant backlog.
- Keep the next few tasks visible without requiring manual reprioritization.
- Capture messy thoughts with near-zero organization overhead.
- Turn notes into a searchable second brain.
- Reward execution with XP and unlockable game time.
- Work well on desktop and mobile, including installable PWA metadata.

## Current prototype

The current version is intentionally database-free. Tasks, XP, and captured notes persist in browser `localStorage`, which lets the interaction model be tested before introducing backend complexity.

Main modes:

- **Today** — Main Quest, AI-ordered queue, XP/reward progress, quick capture.
- **Capture** — note/task/decision/idea capture with a deliberately unstructured writing surface.
- **Memory** — searchable prototype memory cards.

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel

Import this GitHub repository into Vercel as a Next.js project. No environment variables are required for the prototype.

## Next phase: Supabase + AI

Once the interaction model feels right, the recommended backend sequence is:

1. Supabase Auth
2. Postgres tables for tasks, captures, projects, rewards, and daily plans
3. Row Level Security
4. Realtime sync across phone and desktop
5. pgvector embeddings for semantic memory
6. AI capture parsing and project/entity extraction
7. automatic priority scoring + daily plan generation
8. optional Google Calendar integration

The UI should remain simple even as the intelligence behind it becomes more sophisticated.
