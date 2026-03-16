# Section 5: Spend Permissions

## Purpose

After the backend smart account exists, the user still needs to authorize it to spend funds.

That is what spend permissions do.

The important relationship is:

- `account` = the user's wallet
- `spender` = the app smart account

So the user is saying:

> this smart account can spend up to this amount of my USDC under these limits

## Why This Section Matters

This app is not following a simple deposit-first model.

It is not:

- user sends funds to the backend first
- backend trades with those funds

Instead:

- user keeps custody in their own wallet
- user grants limited permission
- smart account uses that permission when execution happens

That is why Section 4 had to be finished first.

We needed the smart account address before we could ask for permission.

## What We Built

We implemented the first durable version of spend permissions in `arb-agent-learn`.

### Frontend

- [spend-permissions.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/lib/spend-permissions.ts)
- [spend-permission.service.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/services/spend-permission.service.ts)
- [Dashboard.tsx](/Users/sebastain/Documents/programs/projects/arb-agent-learn/client/src/pages/Dashboard.tsx)

The dashboard can now:

- request a spend permission from the user's Base wallet
- save the returned permission through the backend
- fetch saved permissions
- show live status from the Base helper
- revoke a permission and mark it revoked in the backend

### Server

- [spend-permissions helper](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/spend-permissions/index.ts)
- [spend-permissions route](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/spend-permissions/route.ts)
- [revoke route](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/spend-permissions/revoke/route.ts)
- [migration](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/supabase/migrations/20260315_create_spend_permissions.sql)

The server now:

- persists permission metadata in Supabase
- validates that the permission belongs to the signed-in user
- validates that the permission spender matches the saved smart account
- returns saved permissions for the current user
- marks permissions as revoked after a revoke flow succeeds

## Storage Decision

This was an important improvement over `arb-agent`.

`arb-agent` saved permission data in `localStorage`.

That is convenient, but not a good source of truth.

For `arb-agent-learn`, we chose:

- Supabase for durable permission metadata
- frontend only for wallet interaction and temporary UI state

That means a browser refresh or a server restart should not make us lose the important permission record.

## Table Shape

We created a `spend_permissions` table with the important fields:

- `permission_hash`
- `user_address`
- `smart_account_address`
- `token_address`
- `chain_id`
- `allowance`
- `period_seconds`
- `status`
- `permission_json`
- timestamps

We store the raw permission JSON because later execution needs the real permission object, not just a summary.

## Current Flow

The current flow is:

1. signed-in user opens dashboard
2. dashboard loads agent wallet
3. dashboard asks Base wallet for spend permission
4. Base wallet returns permission object and signature
5. frontend sends that permission to backend
6. backend validates and stores it in Supabase
7. dashboard can fetch and display saved permissions
8. revoke flow updates both wallet-side permission state and backend record

## Important Guardrails

The backend checks:

- signed-in user must match `permission.account`
- saved smart account must match `permission.spender`

So the client cannot just save arbitrary permission data for another user or another smart account.

## What We Learned Along the Way

### 1. Section 4 had to be corrected before Section 5 could really work

At first, we had real CDP owner accounts and smart-account-related work, but the earlier smart account setup was not fully aligned with the spend-permissions path.

The important fix was making smart-account creation use:

- `enableSpendPermissions: true`

That taught us that spend permissions are not just a UI flow.
The wallet setup itself has to be compatible.

### 2. Old CDP accounts can become migration problems

We hit the case where:

- an owner account already existed in CDP
- the Supabase mapping had been deleted
- recreating the same account by name failed with `already_exists`

That taught us that deleting the DB row is not enough if the real CDP objects still exist.

The better fix was to reuse CDP objects when possible instead of blindly recreating them.

### 3. `getOrCreate...` is cleaner than manual create-first logic

We originally used create methods directly.
That led to duplicate/conflict problems.

We improved the wallet helper by using:

- `cdp.evm.getOrCreateAccount(...)`
- `cdp.evm.getOrCreateSmartAccount(...)`

That made the flow more resilient.

### 4. Some old smart accounts were not spend-permission-ready

We also hit the case where an older smart account existed by name, but it was created before spend permissions were enabled.

So we learned:

- not every existing smart account is automatically good enough for the next section
- old infra sometimes needs an upgrade path, not just reuse

That is why the helper now checks whether the smart account is spend-permission-ready and can create a new upgraded smart account when needed.

### 5. Durable storage matters here too

We decided not to keep permission state only in the browser.

This reinforced the same lesson from earlier sections:

- important app state should not depend on frontend-only storage
- important user-linked infrastructure should survive refreshes and restarts

### 6. The raw permission object matters

We learned that we should not only store a summary like allowance and token.

The real permission object is needed later for execution.

That is why we store:

- metadata fields for querying and validation
- the full `permission_json` for later use

## Current Status

`Working First Pass`

The first durable checkpoint is now working:

- request permission
- save permission
- fetch permission
- read live status
- revoke permission

## Next Step

Next we should improve one of these:

- better expired-vs-active handling in the UI
- tighter handoff from saved permission to arbitrage execution
- clearer upgrade handling for older smart accounts
