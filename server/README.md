# Next.js Server Template (API Only)

API-first Next.js template for backend work only.

- No client pages/components
- Route handlers under `/api/v1/...`
- Supabase as the database

## Endpoints

- `GET /api/health`
- `GET /api/todos`
- `POST /api/todos`
- `GET /api/todos/:id`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Add your Supabase values to `.env.local`.

4. Run dev server:

```bash
pnpm dev
```

## Frontend Connection Modes

### Best for local dev

Run the Vite client separately and proxy `/api` to this Next.js app.

- Next server: `http://localhost:3000`
- Vite client: `http://localhost:5173`
- Vite proxy target: `http://localhost:3000`

This avoids CORS pain during development because the browser talks to Vite and Vite forwards `/api` requests to Next.

### Best for deployment simplicity

Use the same parent domain with separate subdomains:

- frontend: `app.example.com`
- api: `api.example.com`

In this setup, configure cookies and CORS carefully so authenticated browser requests can reach the API safely.

### Simplest overall

Serve the built Vite app behind this Next.js app or behind a reverse proxy such as Nginx or Caddy, and forward `/api` traffic to Next.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLIENT_ORIGIN`

## Notes

- This template assumes a `todos` table with columns:
  - `id` (uuid or text primary key)
  - `title` (text)
  - `done` (boolean, default false)
  - `created_at` (timestamp, optional)

## CORS Note

This template now includes API CORS handling through `middleware.ts` so the Vite client can connect cleanly in local dev and can be adapted for split-domain deployment.
