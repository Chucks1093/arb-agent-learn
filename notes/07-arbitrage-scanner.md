# Section 7: Arbitrage Scanner

## Purpose

Now that the server can read quotes from Uniswap and Aerodrome, the next step is to compare them and decide whether an opportunity may exist.

This section is the first place where the app starts behaving like an arbitrage product instead of just a set of wallet and DEX helpers.

## What We Built

- [scanner.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/arbitrage/scanner.ts)
- [route.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/arb-opps/route.ts)

The scanner does a small simulation:

1. start with a USDC amount
2. simulate `USDC -> WETH` on Uniswap
3. simulate `USDC -> WETH` on Aerodrome
4. build two round-trip paths:
   - buy on Uniswap, sell on Aerodrome
   - buy on Aerodrome, sell on Uniswap
5. compare final USDC amounts
6. subtract a rough gas estimate
7. return a recommendation

## Why We Did It This Way

We did **not** jump straight into the bigger reference implementation from `arb-agent`.

The reference scanner mixes:

- more logging
- more debugging
- more assumptions
- more presentation fields

For `arb-agent-learn`, we wanted the simpler core:

- quote both DEXes
- simulate both directions
- compare outputs
- report whether there may be profit

## Current Endpoint

- `GET /api/arb-opps?amount=10`

This returns:

- the initial trade size
- the buy quotes
- both round-trip path simulations
- a recommendation

## Important Limitation

This is still a **rough scanner**, not final execution truth.

It uses:

- live quote reads
- a fixed rough gas-cost estimate

So it is useful for learning and for the next execution section, but it is not yet the final production-grade profit engine.

## What We Learned

### 1. Arbitrage should be simulated as a round trip

It is not enough to say:

- one DEX gives more WETH
- another gives less WETH

The real question is:

- if we start with USDC and go all the way back to USDC, do we end up with more than we started with?

That is why the scanner simulates both directions fully.

### 2. Scanner should build on quote helpers, not read contracts directly

Section 6 was important because it gave us:

- one Base client
- one address layer
- one quote helper per DEX

The scanner should sit on top of those helpers instead of becoming a second config layer.

### 3. Gross profit is not enough

Even if the round trip gives more USDC back before costs, the path may still be bad after gas.

So the scanner already separates:

- gross profit
- net profit

### 4. The original app does not run a permanent scan loop

When we checked the original `arb-agent`, the scanner is triggered by chat/tool calls.

So the original flow is:

- user asks chat to scan
- backend runs the scan once
- result comes back

It is **not** an always-running background bot.

That matters because it helped us separate:

- learning/manual scan mode
- future bot mode if we ever add background scanning later

## Current Status

`Completed`

The first working scanner checkpoint is done:

- live quotes
- bidirectional simulation
- rough recommendation endpoint
- scanner logic grouped under `server/src/lib/arbitrage/`

## Next Step

Move into Section 8:

- when the client triggers the request, the server rescans
- if the opportunity still looks good, the server executes immediately
- no extra client confirmation in the middle
