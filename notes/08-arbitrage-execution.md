# Section 8: Arbitrage Execution

## Purpose

Section 7 can tell us whether an opportunity may exist.

Section 8 is where the server turns that into a real action:

- check the latest opportunity again
- use the saved spend permission
- execute the swaps through the agent smart account
- send the USDC back to the user

## The Product Decision We Made

We explicitly decided **not** to do this flow:

1. client scans
2. client sees opportunity
3. client confirms
4. server executes later

We did not want that because it wastes time.

So for `arb-agent-learn`, the learning execution flow is:

1. client triggers the request
2. server rescans immediately
3. if no opportunity exists, return `executed: false`
4. if opportunity still exists, server executes immediately
5. client receives the final result

That keeps the decision and execution on the server side once the request starts.

## What We Built

- [execute.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/arbitrage/execute.ts)
- [scanner.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/arbitrage/scanner.ts)
- [route.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/execute/route.ts)

We also grouped the arbitrage logic under:

- `server/src/lib/arbitrage/`

So now scanner and execution live together instead of being scattered.

## Current Server Flow

When `POST /api/execute` is called:

1. check session
2. load or create the user’s saved agent wallet
3. load the saved spend permission from Supabase
4. rescan the opportunity live using the requested trade size
5. if the best path is still profitable enough, execute immediately

The execution steps are:

1. use spend permission to pull USDC into the smart account
2. do the buy leg on the chosen DEX
3. read the real WETH balance after the buy leg
4. do the sell leg on the other DEX
5. read the real USDC balance after the sell leg
6. transfer the resulting USDC back to the user

## What We Changed Compared To The Original App

We did **not** copy the original executor as-is.

The original `arb-agent` executor is useful for understanding the idea, but it is rough:

- hardcoded trade direction assumptions
- rough output assumptions
- weaker balance-based accounting
- too prototype-like for our learning structure

In `arb-agent-learn`, we improved it by:

- rescanning live inside execution
- loading the saved permission from Supabase instead of trusting raw client payload
- loading the wallet from our own wallet layer
- using actual balance reads between swap legs
- keeping scanner and execution together in one `arbitrage/` module

## Important Detail About CDP SDK

We found that the CDP SDK already gives us the right building blocks:

- `smartAccount.useSpendPermission(...)`
- `smartAccount.sendUserOperation(...)`
- `smartAccount.waitForUserOperation(...)`

So we used:

- `useSpendPermission` for pulling the USDC
- `sendUserOperation` for the DEX swaps and USDC transfer back

That is cleaner than rebuilding the spend-permission calldata path ourselves again.

## What We Learned

### 1. The client can trigger the request without sitting in the middle

This was the key clarification.

It is okay for the client to start the flow.

But once the request starts, the server should:

- scan again
- decide
- execute

without waiting for a second client confirmation.

### 2. Runtime wallet objects still need to be reloaded after restarts

Supabase stores the durable wallet metadata.

But the live CDP smart-account object is still a runtime object.

So when needed, we rehydrate it from the saved wallet names.

### 3. Quote output is not enough for the second leg

For the sell leg, we should not blindly trust the originally quoted WETH amount.

We now read the smart account’s actual WETH balance after the buy leg and use that as the real input to the sell leg.

That is closer to reality.

### 4. Important data should come from the backend, not from the browser

For execution, we do not want to trust a raw permission object coming from the client every time.

So we store the permission in Supabase and reload it by user and permission hash when execution happens.

## Current Status

`In Progress`

The first backend execution checkpoint is done:

- single `/api/execute` route
- immediate server-side rescan
- immediate execution if still profitable
- no second client confirmation step

## Next Step

Next we should improve one of these:

- add a small client control to trigger `/api/execute`
- improve failure handling / recovery if a mid-execution step fails
- refine gas/profit accounting with better post-trade numbers
