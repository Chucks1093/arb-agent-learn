# Section 3: User Session Flow

## Purpose

Take the working authentication flow and turn it into a usable app session flow.

Authentication by itself only proves the user can sign in.

This section makes the app behave correctly after sign-in:

- authenticated users should land in the app
- unauthenticated users should land on auth
- protected pages should stay protected
- sign out should clear the session and send the user back to auth

## What We Added

### Client Routing

We restored the route structure so the app now uses:

- `/auth` for the authentication screen
- `/` for the dashboard

Any unknown route is redirected by the auth loader to the correct place based on session state.

### Client Session Guards

We added session-aware route loaders in `auth.service.ts`:

- `rootLoader()`
- `guestOnlyLoader()`
- `requireAuthLoader()`

These loaders decide whether the user should:

- stay on the dashboard
- stay on the auth page
- be redirected to the correct route

### Dashboard

We added a basic authenticated dashboard page.

Its current job is simple:

- confirm the user is authenticated
- show the connected wallet address
- provide a sign-out button

### Logout

We added logout on both sides:

- client calls `POST /api/auth/logout`
- server clears the session cookie
- client updates session state and navigates back to `/auth`

## Files

### Client

- [App.tsx](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/App.tsx)
- [Authentication.tsx](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/pages/Authentication.tsx)
- [Dashboard.tsx](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/pages/Dashboard.tsx)
- [auth.service.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/services/auth.service.ts)

### Server

- [logout route](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/auth/logout/route.ts)
- [session.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/auth/session.ts)
- [verify route](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/auth/verify/route.ts)

## What Is Working

At this point:

- `/auth` is the guest entry page
- `/` is the protected dashboard
- signed-in users are sent into the app
- signed-out users are sent back to auth
- logout clears the session flow correctly

We also built both the client and server after restoring these pieces.

## Status

`Completed`

## After This

`Section 4: Server Wallet / Agent Wallet`
