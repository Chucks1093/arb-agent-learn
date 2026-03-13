# Section 1: Project Foundation

## Purpose

Set up the learning repo so we can rebuild `arb-agent` with a split architecture:

- `server/` for the Next.js backend
- `client/` for the Vite frontend

## What We Already Did

We created the base repo structure in `arb-agent-learn`:

- copied the Next.js server template into `server/`
- copied the Vite client template into `client/`
- connected the Vite app to the Next app through `/api`

## Current Foundation State

### Server

The Next.js app is being used as the backend/API layer.

We added local/frontend connection support so it can work with the Vite client.

Key idea:

- Vite should call `/api/...`
- Vite dev server proxies those requests to Next in local development

### Client

The Vite app is the frontend app.

We cleaned out the vessel-related pages/components so the template is less noisy for this learning process.

## Local Dev Connection

The intended local setup is:

- Next server on `http://localhost:3000`
- Vite client on `http://localhost:5173`
- Vite proxies `/api` to Next

## Why This Section Matters

Before wallet auth, spend permissions, scanner logic, or AI can work, the repos must be structured correctly.

This section gives us:

- separation of frontend and backend concerns
- a cleaner learning environment
- a good base for the rest of the app

## Status

`Completed`

## Next Section

`Section 2: Authentication`
