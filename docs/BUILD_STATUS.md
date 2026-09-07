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
  - Vietnamese street-food tokens (inox, street-cart red, chalkboard slate, sauce colors) defined via CSS variables in `src/styles/tokens.css`.
  - Anti-AI-slop rule enforced: No emoji UI (Lucide SVG icons only), no glassmorphism, no purple/blue AI gradients.
  - `GameShell`: Mobile-first responsive wrapper (390×844 CSS px) with bounded desktop framing, HUD coin & level display, sound & music settings drawer.
  - `ErrorBoundary` & `LoadingScreen`: Street-food cart themed states with Vietnamese copy.
  - `PhaserContainer`: React wrapper mounting Phaser 3 with strict canvas lifecycle cleanup to eliminate WebGL memory leaks.
  - `BootScene`: Generates procedural geometric placeholder textures (`pan_surface`, `oil_bubble`, `prep_tray`, `fish_ball_classic`, `beef_ball_classic`, `sausage_red`).
  - `KitchenScene`: Initial cooking scene with sizzling oil particles, street food counter, and interactive tray items.
  - `useAppStore`: Zustand store managing UI state strictly isolated from Phaser GameObjects.
- **Verification Commands & Results**:
  - `pnpm run typecheck`: Passed (0 errors)
  - `pnpm run lint`: Passed (0 errors, 0 warnings)
  - `pnpm run format`: Passed (all files match Prettier style)
  - `pnpm run test`: Passed (2 test files, 7 tests passed)
  - `pnpm run build`: Passed (`dist` generated, vendor chunks split)

---

## Current Architecture Decisions
1. **Frontend**: React 19 + TypeScript + Vite + Phaser 3 + Zustand.
2. **Backend**: Hono on Vercel Functions (`/api/v1/...`).
3. **Styling & Assets**: Design tokens mapped to CSS variables. Lucide SVG icons instead of emojis. Clean procedural placeholders for Phase 1/2 until cooking loop is locked.
4. **Boundary Isolation**: Phaser GameObjects are strictly kept out of Zustand/React state.
5. **Database (Prepared)**: Neon PostgreSQL with Drizzle ORM (scheduled for Phase 3).

---

## Next Phase
- **Phase 2 — Cooking vertical slice**:
  - Pan/oil scene mechanics (pan slots & oil temperature).
  - Generic food entity with cooking state machine (`raw` -> `cooking` -> `perfect` -> `overcooked`).
  - Tap / drag food item from prep tray into frying oil.
  - Timer and visual cues (golden frying transition, bubble sizzle FX).
  - Tap / scoop to remove cooked food onto resting plate.
  - Single customer order generator and order evaluation (scoring perfect vs undercooked/burned).
  - Local Plausibility / serve evaluation.
