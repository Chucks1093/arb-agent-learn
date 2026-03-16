# Section 6: Base Chain and DEX Configuration

## Purpose

Before we can scan arbitrage opportunities, the server needs a clean onchain configuration layer.

That means:

- one Base RPC client
- one place for token addresses
- one place for DEX addresses
- one place for ABIs
- small quote helpers we can build on later

## Why This Section Exists

The scanner and executor both depend on the same onchain setup.

If addresses, ABIs, and RPC setup are scattered around the codebase, the later sections get messy fast.

So this section is about creating a stable foundation for all later chain reads and swaps.

## What We Took From `arb-agent`

In the reference app, the important config pieces were:

- `addresses.ts`
- `chain.ts`
- `dex.ts`
- scanner logic on top of those

That showed the right general idea:

- constants first
- quote helpers second
- scanner later

But the reference app had some duplication and mixed too many concerns together.

## Rule For This Section

We are not copying config and ABI files blindly from `arb-agent`.

The rule for `arb-agent-learn` is:

1. inspect how `arb-agent` did it
2. check the official docs or official contract source
3. confirm the right function shape and addresses
4. implement the smallest version that fits our codebase cleanly

So for this section:

- `arb-agent` showed us the structure
- official docs and official contracts are the authority
- `arb-agent-learn` gets the cleaner implementation

## What We Built In `arb-agent-learn`

### Base config

- [addresses.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/base/addresses.ts)
- [client.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/base/client.ts)
- [tokens.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/base/tokens.ts)

This gives us:

- one Base public client
- token metadata for USDC and WETH
- protocol addresses for Uniswap V3 and Aerodrome

### DEX helpers

- [types.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/dex/types.ts)
- [uniswap.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/dex/uniswap.ts)
- [aerodrome.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/dex/aerodrome.ts)

This gives us:

- a shared quote result type
- one Uniswap quote helper
- one Aerodrome quote helper

### ABIs

- [uniswapV3QuoterV2.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/dex/abis/uniswapV3QuoterV2.ts)
- [aerodromeRouter.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/lib/dex/abis/aerodromeRouter.ts)

We kept these minimal.

Only the functions needed for quote reads are included right now.

## Where We Got The ABIs From

This part is important.

We should not treat random ABI dumps as the source of truth.

### Uniswap

For Uniswap V3, the right sources are:

- official docs: [docs.uniswap.org](https://docs.uniswap.org/)
- official contracts repo: [Uniswap v3 periphery](https://github.com/Uniswap/v3-periphery)
- official V3 deployment list for Base

For this section, we explicitly confirmed that we are using the **Uniswap V3** deployment set on Base:

- `UniswapV3Factory`
- `QuoterV2`
- `SwapRouter02`

The Base addresses we are using match the V3 deployment list:

- `UniswapV3Factory`: `0x33128a8fC17869897dcE68Ed026d694621f6FDfD`
- `QuoterV2`: `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a`
- `SwapRouter02`: `0x2626664c2603336E57B271c5C0b26F421741e481`

The quote helper in this section only needs the `QuoterV2` read function:

- `quoteExactInputSingle`

So instead of copying a huge ABI, we kept only the ABI entry for that function.

### Aerodrome

For Aerodrome, the ABI usually comes from:

- official contracts repo: [aerodrome-finance/contracts](https://github.com/aerodrome-finance/contracts)
- verified contract on BaseScan when needed

The quote helper in this section only needs:

- `getAmountsOut`

So again, we kept only the smallest ABI needed for the learning repo.

## What We Learned About ABI Sourcing

The clean rule is:

- use docs for architecture and intended usage
- use official repos for contract definitions and artifacts
- use verified explorers when docs do not directly expose the ABI cleanly
- keep only the ABI fragments we actually need in the learning repo

We also learned an important version-matching rule:

- not every Uniswap deployment list is the right one for our code
- the address list, ABI, and function signature must all belong to the same protocol version

In our case:

- we are using **Uniswap V3**
- so we must use the **V3 Base deployment list**
- and the **V3 QuoterV2 ABI**

That keeps the codebase smaller and easier to understand.

### Test route

- [route.ts](/Users/sebastain/Documents/programs/projects/arb-agent-learn/server/src/app/api/base/quotes/route.ts)

This route lets us test the chain config with:

- `GET /api/base/quotes`
- optional query: `?amount=10`

The route currently:

- takes a USDC input amount
- gets a Uniswap V3 USDC -> WETH quote
- gets an Aerodrome USDC -> WETH quote
- returns both in one response

## Design Choice

We deliberately did **not** bring Slipstream into the learning repo yet.

Reason:

- the core app story is already clear with Uniswap V3 + Aerodrome
- Section 6 should stay small and understandable
- we can add more DEX variants later only if they are really needed

## What We Learned

### 1. This section should stay thin

The config layer should not become the scanner.

Its job is:

- hold constants
- hold clients
- hold small raw read helpers

That keeps later sections easier to reason about.

### 2. Minimal ABIs are easier to work with

We do not need giant ABI files for every step.

For the learning repo, it is better to start with only the read functions we actually use.

### 3. The learning repo should match our own structure

Even when the reference app works, we should still fit the implementation into the structure we want:

- `base/` for shared chain setup
- `dex/` for protocol-specific quote helpers
- one shared client instead of multiple scattered clients

That way later sections build on a codebase that is easier to reason about.

### 3. One shared Base client is cleaner

Instead of creating new public clients in multiple places, we now have one shared Base client file.

That will make later sections less repetitive.

## Current Status

`In Progress`

The first checkpoint is done:

- Base client exists
- token and DEX addresses are centralized
- Uniswap and Aerodrome quote helpers exist
- a test route exists to prove chain reads work

## Next Step

Next we should test the quote route and then move into:

- Section 7: Arbitrage Scanner

That section will build on these quote helpers instead of reading contracts directly from the scanner.
