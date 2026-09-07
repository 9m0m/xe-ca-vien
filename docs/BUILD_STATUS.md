# Xe Cá Viên — Build Status

## Completed Phases

### Phase 1 — Repository Foundation (COMPLETE)
- **Tooling & Setup**:
  - Initialized Git with `main` branch and remote `https://github.com/9m0m/xe-ca-vien.git`.
  - pnpm 9 + Node.js 22 + React 19 + strict TypeScript + Vite 6 + Tailwind CSS + Phaser 3.90.
  - Vercel Function integration with Hono 4 + Zod schema validation under `/api/v1/...`.
  - ESLint 9 flat config + Prettier formatting.
  - Vitest test suite with jsdom.
- **Frontend Architecture**:
  - Vietnamese street-food tokens (inox, street-cart red, chalkboard slate, sauce colors) defined via CSS variables.
  - Anti-AI-slop rule enforced: No emoji UI (Lucide SVG icons only), no glassmorphism, no purple/blue AI gradients.
  - `GameShell`: Mobile-first responsive wrapper (390×844 CSS px) with bounded desktop framing, HUD coin & level display, sound & music settings drawer.
  - `ErrorBoundary` & `LoadingScreen`: Street-food cart themed states with authentic Vietnamese copy.
  - `PhaserContainer`: React wrapper mounting Phaser 3 with strict canvas lifecycle cleanup to eliminate WebGL memory leaks.
  - `useAppStore`: Zustand store managing UI state strictly isolated from Phaser GameObjects.
- **Verification**: Typecheck, lint, format, tests, and production build all passed.

---

### Phase 2 — Cooking Vertical Slice (COMPLETE)
- **Data Model & Catalog**:
  - Generic `FoodItemConfig` interface in `src/game/types.ts` defining cook timings, perfect windows, rewards, shapes, and serving styles.
  - Initial Tier 1 catalog seeded in `src/game/data/catalog.ts` (`fish_ball_classic`, `beef_ball_classic`, `sausage_red`, `fish_tofu`).
- **Cooking Engine & State Machine**:
  - `CookingManager` handles 6 pan frying slots, time elapsed, state transitions (`raw` -> `cooking` -> `perfect` -> `overcooked`), and capacity bounds.
  - Interactive frying: Tap food item on prep tray to fly & drop into hot oil with `oil_splash` particle burst.
  - Visual frying feedback: Continuous oil bubbles, circular progress arc around active slots, and authentic food tint shift (raw -> sizzling amber -> golden crispy -> dark overcooked).
  - Scooping mechanic: Tap cooking item in pan to scoop onto the stainless steel `serving_plate`.
  - Order generation & evaluation: Dynamic customer orders generated from catalog; order fulfillment evaluated against plated items with bonuses for perfect frying and penalties for raw/burned items.
  - React HUD synced with coins/XP earnings and floating feedback notifications.
- **Verification**: Typecheck, lint, format, tests, and production build all passed.

---

### Phase 3 — PostgreSQL Persistence (COMPLETE)
- **Database & Drizzle ORM**:
  - Configured Drizzle ORM with `@neondatabase/serverless` and PostgreSQL migration generator.
  - Schema defined in `src/db/schema.ts`: `players`, `player_sessions`, `player_progress`, `player_food_unlocks`, `player_upgrades`, and `order_runs`.
  - Generated PostgreSQL migrations in `drizzle/0000_steep_night_nurse.sql`.
  - Created `PlayerRepository` with Neon HTTP driver and graceful in-memory mock fallback for offline tests and preview environments.
- **Server-Authoritative Progression & Auth**:
  - `POST /api/v1/session/guest`: Zero-barrier instant guest access issuing opaque 30-day session tokens.
  - `GET /api/v1/player`: Authenticated player profile and balances retrieval.
  - `POST /api/v1/orders/complete`: Zod-validated reward submission enforcing `idempotencyKey` against replay attacks or double-rewarding.
- **Client Session Hydration**:
  - `useAppStore`: Implemented `initSession()` and `submitOrderReward()`, keeping progression server-authoritative and persisting across page refreshes.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (4 test files, 19 tests passed)
  - `pnpm run build`: Passed (clean vendor and app chunks)

---

## Current Architecture Decisions
1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Database**: PostgreSQL hosted on Neon with Drizzle ORM + generated migrations.
4. **Authority**: Server is the sole authority for currency, level, and unlocks. Browser receives verified state.
5. **Idempotency**: All reward submissions require a unique idempotency key logged in `order_runs`.

---

## Next Phase
- **Phase 4 — Large content catalog**:
  - Wire full `docs/FOOD_CATALOG.md` (60 Vietnamese street food items) into typed data catalog across 5 unlock tiers and 6 categories (`vien`, `tofu_cake`, `sausage`, `surimi`, `dumpling`, `cheese_crispy`).
  - Add Collection / Menu Book modal in React UI (`Bộ Sưu Tập Món Ăn`) to view unlocked and locked street foods with details, cook times, and rewards.
  - Add Street-Cart Food Shop modal (`Cửa Hàng Món Mới`) to purchase and unlock new street foods with earned coins.
  - Implement server-authoritative unlock endpoint (`POST /api/v1/shop/unlock`).
  - Wire at least 20+ playable items with procedural textures into the frying gameplay.
