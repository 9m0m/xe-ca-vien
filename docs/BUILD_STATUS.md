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
- **Verification**: Typecheck, lint, format, tests, and production build all passed.

---

### Phase 5 — Sauce / Serving Depth (COMPLETE)

- **Southern Vietnamese Sauce System**:
  - Catalog in `src/game/data/sauces.ts`: Tương ớt (`tuong_ot`), Tương đen (`tuong_den`), Mayonnaise (`mayo`), Sốt me (`sot_me`), Sa tế (`sa_te`), Dưa chua ăn kèm (`dua_chua`).
  - Procedural squeeze bottle sprites and pickle bowl in `BootScene`.
- **Interactive Sauce Bar in Phaser**:
  - Sauce bar positioned between frying pan and serving plate.
  - Tap squeeze bottle -> tactile tilt tween animation, squirt particle effect, toggles sauce on current plate.
  - Visual plate feedback: displays active sauce tags (`Đã rưới: Tương ớt + Mayonnaise + Dưa chua`).
- **Customer Preferences & Satisfaction Scoring**:
  - Orders generate requested sauces and serving styles (`skewer` vs `tray`).
  - Multi-dimensional satisfaction score (0–100%):
    - Frying cook perfection (0–50 pts)
    - Sauce & pickle accuracy (0–30 pts)
    - Service speed within patience limit (0–20 pts)
  - Satisfaction >= 80% awards +25% tip coins bonus and +5 reputation.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (7 test files, 30 tests passed)
  - `pnpm run build`: Passed (production bundle ready)

---

## Current Architecture Decisions

1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Food & Sauce Simulation**: Deterministic data-driven modeling in `CookingManager` and `catalog.ts` / `sauces.ts`.
4. **Authority**: Progression, unlocks, and rewards are server-authoritative.
5. **Database**: PostgreSQL on Neon via Drizzle ORM.

---

## Next Phase

### Phase 6 — Progression & Upgrades (COMPLETE)

- **Cart Upgrades System**:
  - Typed multi-tier catalog in `src/game/data/upgrades.ts`:
    - `pan_capacity`: Chảo Dầu Mở Rộng (6 -> 8 -> 10 vị trí chiên đồng thời).
    - `oil_thermostat`: Bếp Gas Điều Nhiệt (+1s / +2s thời gian chín vàng hoàn hảo).
    - `awning_comfort`: Mái Bạt Che Mát Vỉa Hè (+15s / +30s thời gian khách kiên nhẫn).
    - `speed_tongs`: Kẹp Gắp Inox Siêu Tốc (tăng tốc độ gắp ráo dầu lên dĩa 50% - 100%).
    - `tray_expansion`: Khay Bày Hàng Mở Rộng (trưng bày 6 món mỗi trang thay vì 4).
- **Achievements & Street Vendor Statistics**:
  - Catalog in `src/game/data/achievements.ts`: 8 street snack milestones (`Khai Trương Buôn May`, `Khách Quen Vỉa Hè`, `Bậc Thầy Chảo Dầu`, `Tay Chiên Chuẩn Xác`, `Đệ Nhất Cá Viên`, `Thực Đơn Phong Phú`, `Nâng Cấp Cơ Ngơi`, `Đại Gia Vỉa Hè`).
  - Audited stats tracking in `player_stats`: `ordersServed`, `perfectItemsFried`, `totalCoinsEarned`.
  - Claim reward system in `player_achievements` and `POST /api/v1/achievements/claim`.
- **Database & Server Authority**:
  - Drizzle migration `drizzle/0002_steep_galactus.sql` tracking `player_upgrades`, `player_stats`, `player_achievements`.
  - Server endpoints:
    - `GET /api/v1/upgrades/catalog`: Returns cart upgrades catalog.
    - `POST /api/v1/upgrades/purchase`: Validates level requirement, cost, max tier, and deducts coins server-side.
    - `GET /api/v1/achievements/list` & `POST /api/v1/achievements/claim`: Claim reward coins and XP securely.
- **Frontend & Phaser Integration**:
  - `UpgradesModal` ("Nâng Cấp Xe Cá Viên"): Tactile hardware upgrades modal with level locks and coin purchase buttons.
  - `AchievementsModal` ("Thành Tựu & Kỷ Lục"): Vendor statistics overview (Đơn hàng, Xiên vàng, Doanh thu) and interactive claim buttons.
  - Header HUD in `GameShell.tsx` updated with `Wrench` (Upgrades) and `Trophy` (Achievements) modals.
  - Phaser `KitchenScene` dynamically renders 6, 8, or 10 pan slots upon upgrade, applies oil thermostat buffer, speeds up scooping animation, and expands prep tray pagination.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (9 test files, 36 tests passed)
  - `pnpm run build`: Passed (clean production build)

---

## Current Architecture Decisions

1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Food & Sauce Simulation**: Deterministic data-driven modeling in `CookingManager` and `catalog.ts` / `sauces.ts`.
4. **Authority**: Progression, unlocks, upgrades, achievements, and rewards are strictly server-authoritative.
5. **Database**: PostgreSQL on Neon via Drizzle ORM.

---

### Phase 7 — Art Production (COMPLETE)

- **Canonical 2.5D Art Pipeline**:
  - `src/game/art/assetRegistry.ts`: Comprehensive registry defining exact sprite keys, dimensions, canonical elevated three-quarter perspective, categories, and Vietnamese visual descriptions per `docs/ART_BIBLE.md`.
  - Elevated 3/4 perspective with grounded contact drop shadows for all food items.
  - Consistent top-left warm key lighting (`0xfffbeb`) and subtle bottom-right bounce.
  - Dark warm 1.5–2px outlines ensuring crisp silhouette legibility across mobile viewports (320px–430px).
- **Southern Vietnamese Street-Food Detailing**:
  - `pan_surface`: Inox rim with metallic sheen, rivets, dual wok loop handles, and shimmering amber oil depth.
  - `serving_plate`: Polished stainless steel rectangular plate with anti-slip embossed ridges and specular highlights.
  - `prep_tray`: Multi-compartment stainless steel ingredient tray with depth shadows.
  - Food items:
    - Cá viên: Natural golden fry blister textures and soft highlight.
    - Bò viên: Deep burgundy-brown base with black pepper flecks and seared crust.
    - Xúc xích đỏ: Characteristic street-cart score cuts (`khía hoa thị`) that open under heat.
    - Đậu hũ cá: Beveled 2.5D cube with golden fried crust sides and soft ivory top.
    - Surimi, dumplings, cheese sticks, and snail specialty shapes with authentic street cues.
  - Squeeze bottles & garnish:
    - 5 translucent squeeze bottles with conical nozzles and sauce fill lines.
    - Sài Gòn blue melamine dish with cucumber wheels and crinkle-cut carrot slivers.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (10 test files, 39 tests passed)
  - `pnpm run build`: Passed (production bundle ready)

---

## Current Architecture Decisions

1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Food & Sauce Simulation**: Deterministic data-driven modeling in `CookingManager` and `catalog.ts` / `sauces.ts`.
4. **Authority**: Progression, unlocks, upgrades, achievements, and rewards are strictly server-authoritative.
5. **Database**: PostgreSQL on Neon via Drizzle ORM.
6. **Art System**: Centralized asset registry adhering strictly to `docs/ART_BIBLE.md` with mobile-first silhouette verification.

---

---

### Phase 8 — Audio + Juice (COMPLETE)

- **Zero-Dependency Web Audio Synthesis**:
  - `src/game/audio/soundManager.ts`: Procedural audio synthesis engine generating authentic Vietnamese street-food sound effects without external audio assets:
    - `startFryingLoop()` / `stopFryingLoop()`: Filtered pink noise with sporadic crackle bursts simulating boiling cooking oil in the wok, dynamically toggled based on active pan items.
    - `playDropSplash()`: Sizzling downward pitch burst when dropping food into boiling oil.
    - `playScoop()`: Resonant stainless steel tongs clink sound upon scooping items to the plate.
    - `playSauceSquirt()`: Crisp tactile squirt chirp when squeezing condiment bottles.
    - `playCashChime()`: Two-tone bright coin bell chime (C6 -> E6) on order completion.
    - `playError()`: Low dull thud tone on incorrect orders or complaints.
  - Store-connected volume and mute control with lazy browser audio context resumption on user interaction.
- **Mobile Haptic Feedback System**:
  - `src/game/systems/haptics.ts`: `triggerHaptic('light' | 'medium' | 'success' | 'warning')` via `navigator.vibrate` with graceful fallbacks for desktop and unsupported environments.
  - Light vibration (12ms) on dropping food & squirting sauces; medium pulse (20ms) on metal tongs scooping; rhythmic success burst `[20, 40, 30]` on serving completed orders; warning buzz `[40, 50, 40]` on order defect.
- **Accessibility & Reduced Motion**:
  - `src/game/systems/accessibility.ts`: `isReducedMotionPreferred()` and `getAnimationDuration(baseMs)` honoring `prefers-reduced-motion: reduce`.
  - Phaser tweens and scooping flights adjust duration to 0ms when reduced motion is requested.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (11 test files, 45 tests passed)
  - `pnpm run build`: Passed (production bundle ready)

---

## Current Architecture Decisions

1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Food & Sauce Simulation**: Deterministic data-driven modeling in `CookingManager` and `catalog.ts` / `sauces.ts`.
4. **Authority**: Progression, unlocks, upgrades, achievements, and rewards are strictly server-authoritative.
5. **Database**: PostgreSQL on Neon via Drizzle ORM.
6. **Art System**: Centralized asset registry adhering strictly to `docs/ART_BIBLE.md` with mobile-first silhouette verification.
7. **Audio & Juice**: Zero-asset procedural Web Audio synthesis with tactile mobile haptics and prefers-reduced-motion safety.

---

### Phase 9 — Responsive / PWA / Accessibility (COMPLETE)

- **Mobile Safe Areas & Viewport Responsiveness**:
  - `src/styles/tokens.css` & `src/index.css`: Added safe-area variables (`--safe-area-top`, `--safe-area-bottom`, etc.) and utility classes (`.safe-area-top`, `.safe-area-bottom`).
  - Viewport fit (`viewport-fit=cover`) enabled in `index.html`.
  - Header handles notch inset top padding (`pt-[env(safe-area-inset-top,0px)]`); footer base trim handles home indicator padding (`pb-[env(safe-area-inset-bottom,0px)]`).
  - Ultra-compact 320px responsive scaling: Header buttons, badges, and coin indicators dynamically size down from 32px to 28px (`h-7 w-7 min-[380px]:h-8 min-[380px]:w-8`) ensuring zero overflow or wrapping on iPhone SE 1st gen and narrow Android devices.
- **Progressive Web App (PWA) Foundation**:
  - `public/manifest.webmanifest`: Standalone PWA manifest with portrait orientation, `#0f172a` street-slate theme color, and metadata.
  - Procedural asset generation for icons: `public/icons/icon.svg`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, and `public/icons/icon-maskable-512.png`.
  - `public/sw.js`: Native Service Worker with precaching of core app shell, Stale-While-Revalidate caching for static chunks, network bypass for `/api/` endpoints, and navigation fallback to `/index.html`.
  - PWA Install prompt integration: Catches `beforeinstallprompt` event and surfaces an install button in `SettingsModal`.
- **Offline / Reconnect Resilience UX**:
  - Live window `online` / `offline` event monitoring synced to `useAppStore`.
  - Ambient street warning banner rendered when disconnected (`WifiOff` icon + "Ngoại tuyến • Đang lưu dữ liệu cục bộ" + "Thử lại" manual retry trigger).
  - Server reward submission automatically checks `isOnline` and falls back to local optimistic state without throwing uncaught network errors.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (12 test files, 49 tests passed)
  - `pnpm run build`: Passed (production bundle ready with PWA assets in `dist/`)

---

## Current Architecture Decisions

1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Food & Sauce Simulation**: Deterministic data-driven modeling in `CookingManager` and `catalog.ts` / `sauces.ts`.
4. **Authority**: Progression, unlocks, upgrades, achievements, and rewards are strictly server-authoritative.
5. **Database**: PostgreSQL on Neon via Drizzle ORM.
6. **Art System**: Centralized asset registry adhering strictly to `docs/ART_BIBLE.md` with mobile-first silhouette verification.
7. **Audio & Juice**: Zero-asset procedural Web Audio synthesis with tactile mobile haptics and prefers-reduced-motion safety.
8. **PWA & Offline**: Native Service Worker offline shell caching, manifest, safe-area insets, and optimistic offline state progression.

---

---

### Phase 10 — Release Hardening (COMPLETE)

- **Critical Path Automated Integration Suite**:
  - `test/integration/critical_path.test.ts`: Validated the complete non-trivial end-to-end user journey specified in `docs/GAME_SPEC.md`:
    1. New visitor creates guest session -> receives 10,000 đ starter capital, Level 1, Tier 1 cart.
    2. Player cooks orders in `CookingManager`, serves customers, earns satisfaction score and tips.
    3. Idempotent reward submission (`POST /api/v1/orders/complete`) validates tokens, records order run, and updates authoritative balances.
    4. Replay attack rejection: Re-submitting the identical idempotency key returns the prior run without double-rewarding.
    5. Refresh simulation: Calling `GET /api/v1/player` with stored session token recovers exact coins and XP.
    6. Cart upgrade purchase: `POST /api/v1/upgrades/purchase` safely deducts coins and elevates `pan_capacity` to Tier 2.
    7. Refresh simulation: Upgrade and modified balances remain completely persisted.
- **Database Index Optimization & Integrity**:
  - `src/db/schema.ts` & Drizzle migration `drizzle/0003_yummy_mach_iv.sql`:
    - Added `idx_order_runs_player` on `order_runs(player_id)`.
    - Existing B-tree indexes confirmed on `player_sessions(session_token)`, `player_food_unlocks(player_id, food_id)`, `player_upgrades(player_id, upgrade_key)`, `order_runs(idempotency_key)`, and `player_achievements(player_id, achievement_id)`.
- **API Hardening, Rate Limiting & Security Headers**:
  - `api/index.ts`:
    - In-memory rolling-window rate limiter on all endpoints (120 requests/minute per client IP), returning HTTP 429 upon excess.
    - Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Production Environment & Vercel Compatibility**:
  - `.env.example`: Clean reference documenting `DATABASE_URL` (Neon PostgreSQL) and `NODE_ENV`.
  - `vercel.json`: Validated Vite framework preset, `dist` output directory, and Hono serverless rewrites.
- **Final Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (13 test files, 53 tests passed)
  - `pnpm run build`: Passed (production build completes in ~8.5s)

---

## Final Project Status

All 10 phases of the `/build-game` workflow have been implemented, verified, and locked in:

- **Phase 1 — Repository Foundation**: React 19, Vite 6, Phaser 3, Tailwind CSS, Inox tokens.
- **Phase 2 — Cooking Vertical Slice**: Multi-slot frying pan state machine, particle splash/bubbles, scooping.
- **Phase 3 — PostgreSQL Persistence**: Neon PostgreSQL driver with in-memory fallback, Drizzle ORM, guest auth, idempotent rewards.
- **Phase 4 — Large Content Catalog**: Full 60 authentic street snacks from `docs/FOOD_CATALOG.md`, Collection book, Shop unlocks.
- **Phase 5 — Sauce / Serving Depth**: 5 Southern Vietnamese squeeze sauces, pickled dish garnish, satisfaction scoring, tips.
- **Phase 6 — Progression & Upgrades**: Hardware cart upgrades (pan capacity, thermostat, awning, tongs, trays), achievements, street statistics.
- **Phase 7 — Art Production**: Procedural 2.5D elevated perspective canvas pipeline adhering strictly to `docs/ART_BIBLE.md`.
- **Phase 8 — Audio + Juice**: Zero-dependency Web Audio procedural synthesis (frying loops, drop splash, tongs clink, squeeze squirt, coin chime), tactile mobile haptics, prefers-reduced-motion safety.
- **Phase 9 — Responsive / PWA / Accessibility**: 320px–desktop responsive layouts, safe-area insets, installable PWA manifest & icons, offline caching Service Worker, reconnect UX.
- **Phase 10 — Release Hardening**: Critical path automated flow test, PostgreSQL indexes, security headers, rate limiting, Vercel readiness.

The codebase is fully tested, hardened, and ready for production deployment on Vercel.
