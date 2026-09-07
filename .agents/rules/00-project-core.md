# Xe Cá Viên — Antigravity Project Core Rule

> Set this Workspace Rule to **Always On** in Antigravity.

## Canonical project identity

- Display name: **Xe Cá Viên**
- Repository slug: `xe-ca-vien`
- Product: casual non-commercial Vietnamese street-food management web game.
- Primary locale: Vietnamese (`vi-VN`).
- Theme: a Southern Vietnamese fried street-food cart with a large, varied menu.
- Target: mobile-first web game that also scales elegantly to laptop/desktop.
- Hosting: Vercel.
- Database: PostgreSQL via Neon/Vercel Marketplace.
- Backend runtime: Node.js on Vercel Functions.

Read these files before planning or implementing any feature:

- @docs/GAME_SPEC.md
- @docs/FOOD_CATALOG.md
- @docs/ART_BIBLE.md

## Non-negotiable stack

Frontend:

- TypeScript with strict mode.
- React + Vite.
- Phaser 3 for game-world rendering and interactions.
- Zustand for app/player UI state.
- Tailwind CSS only where it improves layout velocity; use CSS variables for design tokens.
- Motion for React UI transitions only.
- PWA support.
- SVG icon system; never use emoji as production icons.

Backend:

- Node.js 22+.
- Hono.
- Zod validation.
- Vercel Functions.
- PostgreSQL hosted with Neon.
- Drizzle ORM + migration files.
- Use parameterized queries/Drizzle; never concatenate SQL strings.
- Progress-changing actions are server-authoritative.

Authentication:

- The game must be playable immediately as a guest.
- Guest progress receives a server-issued opaque session/player identity.
- Never use localStorage as the source of truth for currency/progression.
- Registered/cross-device accounts may use Better Auth/Neon Auth later.
- Authentication must not block the first play session.

Testing and tooling:

- pnpm.
- ESLint.
- Prettier.
- Vitest.
- Playwright for critical user flows.

Do not replace this stack without an explicit user request.

## Architecture boundaries

React owns:

- loading screen
- menus
- HUD
- shop
- inventory
- collection/catalog
- upgrades
- achievements
- settings
- dialogs
- responsive shell
- accessibility controls

Phaser owns:

- frying/cooking scene
- pan/oil scene
- ingredient sprites
- drag/drop/tap interactions
- cooking timers as visual/gameplay presentation
- customers rendered inside the game scene
- particles
- juice/game feel
- sprite animation

Backend owns authoritative:

- player profile
- coins
- XP/level
- unlocks
- inventory ownership
- upgrades
- purchases
- achievements
- order rewards
- anti-cheat validation
- save timestamps
- server-generated order/session identifiers

Never put Phaser GameObjects in React/Zustand state.
Never let the browser directly award coins/XP/unlocks.
Never expose database secrets in Vite/public environment variables.

## Game design principle

The game is content-rich, not mechanically bloated.

We WANT many food items.
We DO NOT want a unique implementation for every food item.

Food content must be data-driven:

- every food item uses a common schema
- categories, cook timing, value, rarity/unlock tier, sprite id, shape, serving type and sauce compatibility are data
- adding a new normal food should usually require no new React component and no new Phaser system

Aim for 40–70 food items over the project, with the catalog seeded early.
Build gameplay systems once, then allow the catalog to expand cheaply.

## Core gameplay loop

1. Customer arrives.
2. Order is generated from unlocked menu items.
3. Player selects food from trays.
4. Player drops/taps food into frying oil.
5. Food passes through raw -> cooking -> perfect -> overcooked.
6. Player removes food.
7. Optional serving/assembly step: skewer, tray, sauce, garnish depending on order.
8. Player serves customer.
9. Server validates completion/reward.
10. Player receives coins + XP.
11. Player buys cart/tray/pan/menu upgrades and unlocks more foods.
12. Difficulty expands via order size, timing overlap and customer patience, not unfair randomness.

## Content scale rules

Seed a large catalog from @docs/FOOD_CATALOG.md early.
Do not render every item simultaneously.
Unlock progressively by tiers/district/day milestones.

Use shared mechanics:

- ball/round
- stick/sausage
- cube/tofu
- dumpling
- roll
- specialty-shape

Cooking configuration is per item, but the cooking system is generic.

Do not make 50 separate cooking classes.

## UX requirements

Primary design reference: 390x844 CSS px.
Must remain usable from roughly 320px mobile width upward.
Desktop should recompose, not merely scale up.

Touch:

- important targets >= 44 CSS px where practical
- no hover-only critical interaction
- prevent accidental page scroll during game drag gestures
- account for safe areas
- landscape should remain usable where reasonable

Desktop:

- centered bounded playfield
- side panels may appear for order/status
- never stretch the game canvas uncontrollably on ultrawide screens

Accessibility:

- reduced motion support
- mute/music/SFX controls
- readable contrast
- do not encode critical state using color alone

## Anti-AI-slop UI rules

The app must look like a game, not an AI-generated SaaS dashboard.

Forbidden unless explicitly requested:

- emoji as interface icons
- purple/blue AI gradients
- glassmorphism everywhere
- nested cards for every region
- giant 24–32px border radii everywhere
- meaningless glow
- generic hero/landing marketing sections
- decorative statistics dashboards
- generic stock illustrations
- fake generated Vietnamese text inside images
- random visual styles between screens
- “Elevate your experience” style copy

Prefer:

- practical street-food visual language
- enamel/inox/cart/menu-board cues used subtly
- compact, tactile controls
- clear hierarchy
- custom food art
- consistent SVG icon set
- typography with Vietnamese glyph support

## Art/asset rules

Follow @docs/ART_BIBLE.md.
Food art and UI icons are separate systems.
Food sprites may be generated later, but prototype gameplay must work with placeholders first.
Oil should be composited from particles/small FX sprites instead of one baked frying image.
Never generate text inside food/environment art.
Store text as real HTML/React or Phaser text with approved fonts.

## Data model guidance

At minimum plan migrations for:

- players
- player_sessions
- player_progress
- food_catalog / game content versioning if content is DB-backed
- player_food_unlocks
- player_inventory
- upgrades
- player_upgrades
- order_runs
- order_items
- achievements
- player_achievements

Static balance/catalog data may live in versioned TypeScript/JSON initially.
Persistent user state belongs in PostgreSQL.

Use idempotency keys for reward/purchase endpoints where duplicate requests could double-award value.

## API conventions

Use `/api/v1/...`.
Zod-validate request input and important response payloads.
Return structured error codes, not only human text.

Suggested endpoints:

- POST /api/v1/session/guest
- GET /api/v1/player
- GET /api/v1/game/config
- POST /api/v1/orders/start
- POST /api/v1/orders/complete
- POST /api/v1/shop/purchase
- POST /api/v1/upgrades/purchase
- GET /api/v1/catalog
- GET /api/v1/achievements

Do not create endpoints until required by a feature.

## Performance

The first playable load must be treated as important.

- lazy-load nonessential menus/assets
- use sprite atlases where useful
- prefer WebP/AVIF for raster UI/environment assets
- transparent PNG/WebP only where alpha is needed
- preload only the current scene's essential audio/art
- avoid huge base64 assets in source
- no unnecessary runtime dependencies

## Development behavior for the agent

Work phase-by-phase using @docs/GAME_SPEC.md.
Before changing code:

1. inspect existing implementation
2. state the smallest coherent change
3. preserve architecture boundaries

After changing code:

1. run typecheck
2. run lint
3. run relevant tests
4. run build
5. fix failures before declaring completion

Do not leave TODO placeholders for required behavior.
Do not claim something works without running the available verification.
Do not rewrite unrelated working code.
Do not add dependencies when the platform/standard library already solves the problem cleanly.

## Quality bar

Best practice means:

- simple architecture
- explicit ownership boundaries
- data-driven content
- secure server authority
- migrations committed
- typed contracts
- resilient mobile UX
- deterministic core game logic
- automated verification
- no premature enterprise architecture

Avoid:

- Redux unless a real need emerges
- NestJS
- GraphQL
- microservices
- Kubernetes
- event sourcing
- elaborate DI containers
- custom design-system abstraction before UI patterns stabilize

## Definition of done for the initial project

The first release candidate is done only when:

- Vercel production build succeeds
- PostgreSQL migrations work on Neon
- new guest can start without signup
- progress persists server-side
- refresh/restoration works
- core frying loop works on touch
- multiple foods can cook concurrently
- at least 20 catalog foods are wired into data, with many more catalog-ready
- shop/unlocks function
- currency cannot be directly awarded by client code
- mobile and desktop layouts are usable
- no emoji production UI
- no obvious AI-slop visual patterns
- error/loading/empty states exist
- critical Playwright flow passes
