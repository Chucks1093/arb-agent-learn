# Arb Agent Learn Sections

This repo is the learning and rebuild version of `arb-agent`.

We will use two codebases side by side:

- `arb-agent`: the reference app
- `arb-agent-learn`: the learning app we rebuild step by step

## Goal

The goal is not to just copy the original app.

The goal is to understand:

- how the app is structured
- how Base SDK works in practice
- how wallet auth and spend permissions work
- how onchain actions are triggered safely
- how AI tools connect to backend routes and blockchain flows

## How We Will Work

For each section:

1. Inspect the section in `arb-agent`
2. Explain how it works clearly
3. Rebuild the same idea in `arb-agent-learn`
4. Test that section
5. Move to the next section

We will not jump around randomly.
We will build one section at a time until the learning app is complete.

## Sections

### 1. Project Foundation

Set up the split architecture:

- `server/` with Next.js for APIs and backend logic
- `client/` with Vite for frontend UI
- environment variables
- local dev connection between client and server

### 2. Authentication

Implement wallet-based authentication with Base:

- nonce generation
- message signing
- signature verification
- session creation
- restoring auth state on reload

### 3. User Session Flow

Handle the authenticated user in the app:

- check active session
- load connected address
- protect app sections that need auth
- sign out flow later if needed

### 4. Server Wallet / Agent Wallet

Create the backend-controlled wallet layer used by the app:

- server wallet creation
- smart account setup
- mapping a user to a backend execution account

### 5. Spend Permissions

Allow the user to grant controlled token spending rights:

- request spend permission
- store permission state
- fetch active permissions
- revoke permissions

### 6. Base Chain and DEX Configuration

Define the onchain setup:

- Base RPC connection
- token addresses
- router and quoter addresses
- ABIs
- chain helper utilities

### 7. Arbitrage Scanner

Read market data and detect opportunities:

- fetch quotes from supported DEXes
- compare prices
- estimate costs
- calculate potential profit
- decide whether an opportunity is worth acting on

### 8. Arbitrage Execution

Turn a validated opportunity into execution steps:

- prepare the execution request
- use spend permissions
- swap through the chosen route
- return funds
- capture transaction results

### 9. AI Chat and Tool Calling

Add the AI layer:

- chat endpoint
- tool definitions
- scan and execute function calls
- context handling
- response formatting

### 10. Frontend App UI

Build the actual product interface:

- sign-in screen
- permission setup flow
- scanner panel
- chat panel
- wallet/session status

### 11. Safety, Validation, and Error Handling

Add the guardrails:

- minimum amounts
- slippage limits
- auth validation
- stale opportunity checks
- execution error handling

### 12. Testing and Production Hardening

Finish the app properly:

- manual test flows
- route testing
- edge case handling
- deployment checks
- production readiness review

## Working Rule

At any point, we should always know:

- which section we are on
- what the reference repo does
- what the learning repo needs
- what is already finished
- what remains

## Current Next Step

We are moving into:

`Section 2: Authentication`
