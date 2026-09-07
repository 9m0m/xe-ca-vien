# Xe Cá Viên — Game Specification

## Product vision

A warm, fast, replayable Vietnamese street-food cart game where the player fries and serves a large variety of familiar snack foods. The fun comes from handling overlapping orders, recognizing foods visually, timing frying, choosing sauces, upgrading the cart and gradually filling out a huge food collection.

## Naming

Display name: **Xe Cá Viên**
GitHub repository: `xe-ca-vien`
Suggested Vercel project slug: `xe-ca-vien` (availability must be checked when creating the project).

Do not hardcode a production domain.

## Visual setting

A stylized but grounded Southern Vietnamese street-food cart.
Local identity should come from ordinary details: inox trays, frying pan, squeeze bottles, skewers, tongs, plastic baskets/stools, menu boards and compact cart organization — not tourist stereotypes.

## Primary loop

Customer -> order -> select foods -> fry -> remove at ideal stage -> sauce/serve -> evaluation -> reward -> upgrade/unlock -> next customer.

## Food model

All normal foods use one shared data model.

Recommended fields:

- id
- displayNameVi
- category
- shapeProfile
- cookTimeMs
- perfectWindowMs
- overcookTimeMs
- basePrice
- baseReward
- unlockTier
- spriteKey
- servingStyle
- sauceTags
- quantityPerOrderRange
- enabled

Food visual states:

- raw
- cooking
- perfect
- overcooked

Prefer shader/tint/overlay differences when possible rather than four unrelated generated images.

## Progression

Suggested progression:
Tier 1: basic cart and classic balls
Tier 2: sausages, tofu/fish cake, dumplings
Tier 3: cheese/mayo/surimi/special shapes
Tier 4: premium seafood and complex mixed orders
Tier 5: specialty street snacks and combo orders

Upgrades can include:

- extra frying slots/pan capacity
- better oil temperature stability
- extra prep tray slots
- extra sauce slot
- customer patience bonus from cart presentation
- faster plating interaction
- additional concurrent order slot
- cosmetic cart upgrades

Do not introduce pay-to-win, paid currency, loot boxes or monetization systems.

## Order design

Orders should be readable quickly:

- 1–3 food types early
- larger quantities later
- sauces introduced after frying is learned
- concurrent customers introduced gradually
- avoid unreadable ingredient icons
- show real illustrated item assets and text labels where useful

## Cooking gameplay

No complex physics simulation is required.
Each frying item has deterministic server/config values and local scene timestamps.
The server should validate high-level plausibility/reward submissions; it does not need to simulate every particle.

Oil game feel:

- small continuous bubbles near food
- short splash burst on drop
- frying loop audio
- subtle bob/rotation
- visual golden progression
- stronger cue near perfect window
- restrained steam

## MVP vs catalog

Catalog can contain 50+ items early.
The first truly polished vertical slice should still prove:

- one pan
- several concurrent items
- one customer
- order completion
- reward
- save
- unlock

After that, enable many catalog items through the same generic systems.

## Phases

### Phase 1 — Repository foundation

- pnpm + Vite + React + strict TypeScript
- Phaser bootstrap
- Hono API under Vercel-compatible routes
- environment validation
- lint/format/typecheck/test/build scripts
- responsive shell
- CSS tokens
- error boundary/loading screen
- no final art required

### Phase 2 — Cooking vertical slice

- pan/oil scene
- generic food entity
- cooking state machine
- tap/drag insert and remove
- bubbles/splash placeholder FX
- one order
- serve/evaluate
- no database cheating assumptions yet

### Phase 3 — PostgreSQL persistence

- Neon connection
- Drizzle schema + migrations
- guest session
- player/progress persistence
- order run records
- secure reward endpoint
- idempotency protection

### Phase 4 — Large content catalog

- wire FOOD_CATALOG into typed data
- unlock tiers
- collection screen
- shop
- at least 20 playable food entries quickly
- continue expanding toward 50+ without per-food logic

### Phase 5 — Sauce/serving depth

- sauce selection
- skewers/trays
- combo order rules
- customer preferences
- satisfaction score

### Phase 6 — Progression

- levels
- cart upgrades
- achievements
- food discoveries
- statistics

### Phase 7 — Art production

- replace placeholders according to ART_BIBLE
- one canonical perspective
- food silhouettes tested at phone size
- environment/cart illustration
- icon set
- asset atlas pipeline

### Phase 8 — Audio + juice

- frying loops
- drop/splash/serve/cash sounds
- restrained visual feedback
- haptics when supported and appropriate
- reduced-motion path

### Phase 9 — Responsive/PWA/accessibility

- test small phone/mobile/desktop
- safe-area handling
- installable PWA
- offline shell where useful
- robust reconnect/retry UX

### Phase 10 — Release hardening

- Playwright critical path
- rate limiting on abuse-prone endpoints if needed
- DB indexes
- production env validation
- monitoring/logging basics
- Vercel deployment verification

## Critical test flow

New visitor -> guest session -> load game -> cook valid order -> serve -> reward saved -> refresh -> same progress restored -> purchase upgrade -> refresh -> upgrade remains.

## Content philosophy

The player should regularly discover something new.
Quantity is welcome only because implementation is data-driven.
Never sacrifice readability, mobile performance or a coherent art style just to increase the item count.
