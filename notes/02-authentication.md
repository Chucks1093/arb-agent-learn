# Section 2: Authentication

## Purpose

Implement wallet-based authentication so a user can sign in with Base and the app can create a trusted session.

This is the first real product flow we need to build.

## What We Need to Understand from `arb-agent`

We need to study:

- the frontend sign-in button and wallet flow
- nonce generation on the server
- signed message verification
- session cookie creation
- session restoration on app load

## What This Section Will Cover

### Client Responsibilities

- trigger wallet connection
- request a nonce from the backend
- ask the wallet to sign in
- send the signed payload to the server
- update UI when the user is authenticated

### Server Responsibilities

- generate and store a nonce
- verify the signed message
- create a session cookie
- expose a session-check endpoint

## Expected Endpoints

We will likely need:

- `GET /api/auth/verify`
- `POST /api/auth/verify`
- `GET /api/auth/session`

## Expected Outcome

When this section is complete:

- the user can sign in with Base
- the backend can verify the wallet identity
- the app can remember the signed-in user
- the frontend can reload and still know the current session state

## Status

`Next`

## After This

`Section 3: User Session Flow`
