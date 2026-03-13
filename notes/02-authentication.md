# Section 2: Authentication

## Purpose

Implement wallet-based authentication so a user can sign in with Base and the app can create a trusted session.

This is the first real product flow we need to build.

## Reference Thinking

We looked at `arb-agent` to understand the broad shape of the flow:

- sign-in button on the client
- nonce generation on the server
- signed message verification
- session cookie creation
- session restoration on app load

But we decided not to copy it exactly.

For the actual implementation, we chose to follow the Base docs more closely and keep the flow simpler.

## What We Built

### Client Responsibilities

- `Authentication.tsx` is the auth screen entry point.
- We kept the existing page structure and only changed the auth-specific content.
- The page now uses React Query to:
  - prefetch a nonce
  - check the current session
  - run the sign-in mutation

### Client Flow

In the client, the flow is now:

1. fetch nonce from `GET /api/auth/verify`
2. initialize `createBaseAccountSDK`
3. switch wallet to Base mainnet
4. call `wallet_connect` with `signInWithEthereum`
5. read `{ address, message, signature }`
6. send that payload to `POST /api/auth/verify`
7. invalidate the session query and show signed-in state

### Client Files

- [Authentication.tsx](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/pages/Authentication.tsx)
- [auth.service.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/services/auth.service.ts)
- [api.service.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/services/api.service.ts)

### Server Responsibilities

- generate and persist a nonce
- verify the signed message with `viem`
- create a session cookie
- expose a session-check endpoint

### Server Flow

On the server, the flow is now:

1. `GET /api/auth/verify`
   - creates a nonce
   - stores it in Supabase
   - returns it in the normal project response shape

2. `POST /api/auth/verify`
   - accepts `{ address, message, signature }`
   - extracts the nonce from the message
   - checks the nonce exists and has not been reused
   - verifies the signature with `viem`
   - creates a session cookie

3. `GET /api/auth/session`
   - reads the session cookie
   - returns the current auth state

### Server Files

- [verify route](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/auth/verify/route.ts)
- [session route](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/auth/session/route.ts)
- [auth-store.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/auth/auth-store.ts)
- [session.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/auth/session.ts)

## Nonce Storage Decision

We first discussed storing nonce in memory, like the original `arb-agent` app.

In `arb-agent`, nonce is kept in an in-memory `Set`.

For `arb-agent-learn`, we chose to store nonce in Supabase instead so the learning app uses a shared, persistent store.

### Supabase Migration

We added a migration for nonce storage:

- [20260313_create_auth_nonces.sql](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/supabase/migrations/20260313_create_auth_nonces.sql)

This creates:

- `public.auth_nonces`
- `nonce`
- `created_at`
- `consumed_at`

## Response Shape Decision

We also aligned the client to the server’s existing response structure instead of inventing a new one.

The project now consistently uses:

- success: `{ success: true, data }`
- error: `{ success: false, error: { message, details } }`

## What Is Working

At this point:

- sign-in button is wired to the Base SDK flow
- nonce is fetched from the server
- nonce is stored in Supabase
- signature is verified on the server
- session cookie is created
- session is restored on page refresh

We confirmed that after refresh, the user remained logged in, which means the session flow is working.

## Status

`Completed`

## Notes

- We intentionally kept auth implementation simple and closer to the Base docs.
- We used `arb-agent` mainly as a reference for app structure, not as something to copy exactly.
- The main auth logic lives in the page for now because that matches how we want to learn this section step by step.

## After This

`Section 3: User Session Flow`
