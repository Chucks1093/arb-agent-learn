# Section 4: Server Wallet / Agent Wallet

## Purpose

After a user signs in, the app needs a backend-controlled execution account for that user.

This account is separate from the user's own Base wallet.

The user wallet is used for:

- authentication
- ownership
- granting permission

The server wallet / smart account is used for:

- app-controlled execution
- acting as the spender later
- preparing for swaps and automation

## Learning Goal

For the first version of this section, we are **not** trying to execute trades yet.

We only want to prove:

1. the backend can create or load an agent wallet for a signed-in user
2. the backend can return that wallet through an API route
3. the frontend can later display it on the dashboard

## What We Added First

We started this section with a **mock wallet mode** and then upgraded it to support real CDP mode.

The important design improvement is that the user-to-wallet mapping is no longer meant to live only in memory.

We now persist the wallet metadata so a returning user does not keep creating fresh CDP accounts and wasting credits.

## Why Mock Mode Exists

This keeps the learning flow moving.

It lets us understand:

- one user maps to one backend wallet
- the wallet route shape
- the dashboard data flow

before adding the complexity of real CDP account creation.

It also lets us test the API contract without burning credits.

## Plain-English Notes

### Why Another Wallet Exists

Signing in with Base only proves the user owns their wallet address.

That user wallet is the identity for auth.

The app still needs its own backend-controlled execution account for that user.

So the mental model is:

- user wallet = login identity
- server smart account = app execution identity for that user

This is **not** created with the user's private key or credentials.

It is a separate backend account linked to the user's address in app logic.

### What CDP Means

`CDP` here means `Coinbase Developer Platform`.

That is the infrastructure used in the reference app to create the backend-controlled account.

### The Simple Flow

This is the flow we are building toward:

1. signed-in user
2. backend creates CDP account
3. backend creates smart account
4. frontend gets smart account address
5. user grants spend permission to smart account

### Why Spend Permission Is Needed

This app is **not** using a simple deposit-first model.

It is not:

- user sends funds to the backend wallet first
- backend trades with those funds

Instead, the model is:

- user keeps funds in their own wallet
- user grants limited spend permission
- the smart account later uses that permission to pull and use funds when needed

So:

- backend smart account executes the trade
- but the user does not have to pre-deposit funds into the backend wallet first

### The Three Pieces Behind "Server Wallet"

What we casually call the "server wallet" is really three pieces:

1. `CDP account`
   This is the backend-created base account.
   Think of it as the backend-controlled owner/signer.

2. `smart account`
   This is the actual onchain execution account used by the app.
   This is usually the address the frontend cares about.

3. `bundler client`
   This is not a wallet.
   It is the infrastructure used to send smart-account operations to the chain.

### Simple Way to Remember It

- `CDP account` = backend owner
- `smart account` = wallet used onchain
- `bundler client` = delivery system for smart-account actions

## Files

### Server

- [agent-wallet helper](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/agent-wallet/index.ts)
- [wallet route](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/wallet/route.ts)
- [env.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/env.ts)
- [.env.example](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/.env.example)
- [agent wallet migration](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/supabase/migrations/20260315_create_agent_wallets.sql)

## Env for This Section

We added:

- `MOCK_WEB3`
- `CDP_API_KEY_ID`
- `CDP_API_KEY_SECRET`
- `CDP_WALLET_SECRET`

For now:

- `MOCK_WEB3=true` means use the learning-mode wallet helper
- `MOCK_WEB3=false` means use real CDP wallet creation

To test real CDP mode, set these in `server/.env`:

- `MOCK_WEB3=false`
- `CDP_API_KEY_ID=...`
- `CDP_API_KEY_SECRET=...`
- `CDP_WALLET_SECRET=...`

## Current API Shape

### `GET /api/wallet`

Returns whether the signed-in user already has an agent wallet in Supabase.

### `POST /api/wallet`

Creates or loads the signed-in user's agent wallet and returns it.

## Current Status

`In Progress`

## Current State

The helper now supports both modes:

- mock mode for learning flow
- real CDP mode when credentials are present and `MOCK_WEB3=false`

The wallet metadata is intended to persist in Supabase so sign-in does not keep creating new CDP accounts for the same user.

## Next Step

Wire this route into the dashboard so the user can see:

- owner address
- smart account address
- mode: mock or cdp
