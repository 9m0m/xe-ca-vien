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
- **Verification**: Typecheck, lint, format, tests, and production build all passed.

---

### Phase 4 — Large Content Catalog (COMPLETE)
- **Full 60-Item Catalog**:
  - All 60 authentic street-food snack items from `docs/FOOD_CATALOG.md` (Sections A through F) wired into typed data structures across 5 unlock tiers and 6 categories (`vien`, `tofu_cake`, `sausage`, `surimi`, `dumpling`, `cheese_crispy`).
  - Procedural geometric textures in `BootScene` for all shape profiles (`round`, `cylinder`, `cube`, `dumpling`, `flat`, `specialty`) with distinct silhouettes.
- **Collection Book & Shop Modals**:
  - `CollectionModal` ("Thực Đơn Xe Cá Viên"): Tab filtering by food category, cook times, reward values, and unlocked/locked badges.
  - `ShopModal` ("Chợ Đầu Mối Vỉa Hè"): Browse locked foods and purchase unlocks with coins.
- **Server-Authoritative Food Unlocks**:
  - `POST /api/v1/shop/unlock`: Deducts coins, records to `player_food_unlocks`, returns updated player balance.
- **Phaser Tray Pagination**:
  - Prep tray in Phaser supports page navigation arrows (`◀` / `▶`) to cycle through all unlocked street foods in groups of 4.
  - Customer orders dynamically request any foods the player has unlocked.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (6 test files, 26 tests passed)
  - `pnpm run build`: Passed (clean vendor, app, and Phaser chunks)

---

## Current Architecture Decisions
1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Food Catalog**: 60 data-driven items conforming to a shared `FoodItemConfig` contract. No per-food classes or custom components.
4. **Database**: PostgreSQL hosted on Neon with Drizzle ORM + migrations.
5. **Authority**: Progression and unlocks are server-authoritative.

---

## Next Phase
- **Phase 5 — Sauce / Serving Depth**:
  - Implement Southern Vietnamese sauce selection system (Tương ớt, Tương đen, Mayonnaise, Sốt me, Sa tế, Nước mắm).
  - Skewer vs tray serving presentation.
  - Customer preference matching (sauce compatibility, garnish/dưa chua).
  - Customer satisfaction grading (speed + cook quality + sauce accuracy).
