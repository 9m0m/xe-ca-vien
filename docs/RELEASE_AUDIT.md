# Production Readiness & Security Audit Report: Xe Cá Viên

**Repository:** `https://github.com/9m0m/xe-ca-vien.git`  
**Date:** September 7, 2026  
**Auditor:** Antigravity Autonomous Security & Quality Engineer  
**Audit Target:** Game engine, serverless API architecture, database integrity, authorization boundary, mobile PWA, and E2E validation.

---

## Executive Summary

A comprehensive production-readiness and adversarial security audit was executed on the `xe-ca-vien` repository. In accordance with zero-trust engineering standards, all claims made by earlier development phases were subjected to rigorous empirical proof.

### Summary of Audit Results
* **Git & Remote Tracking:** ✅ Synchronized to `https://github.com/9m0m/xe-ca-vien.git` (`main` branch) with zero secrets tracked.
* **Server Authority & Anticheat:** ✅ Fully migrated order reward calculation to server-authoritative logic. Client-submitted coins/XP are strictly ignored.
* **Database & Concurrency Safety:** ✅ In-memory fallback strictly blocked in production (`NODE_ENV === 'production'`). Added composite unique indexes on unlocks, upgrades, and achievements. Balance modifications use atomic SQL conditionals (`WHERE coins >= cost RETURNING coins`).
* **Authentication & Sessions:** ✅ Dual support for HttpOnly cookies (`xcv_session`) and `Authorization: Bearer <token>`.
* **Browser & E2E Validation:** ✅ Installed `@playwright/test` and executed end-to-end tests across **390x844 Mobile**, **320px Narrow Mobile**, and **Desktop 1280x720** viewports using real Google Chrome on Windows. All passed.
* **Build & Code Quality:** ✅ TypeScript (`tsc --noEmit`), ESLint, Prettier, and Vite production bundle passed with 0 errors and 0 warnings.
* **External Deployment Gates:** ⚠️ Platform-gated items (Neon live database credentials and Vercel CLI deployment linking) are accurately documented as external infrastructure dependencies.

---

## Detailed Section-by-Section Findings

### 1. Git & Remote Repository Integrity
* **Status:** ✅ **PASS**
* **Finding:** The remote GitHub repository (`https://github.com/9m0m/xe-ca-vien.git`) was previously empty because `git push` had not been executed.
* **Action Taken:**
  * Inspected tracked files and verified that `.env`, `.env.local`, API tokens, database credentials, and secrets were not present in git tracking.
  * Configured upstream tracking and pushed the complete commit history to `origin/main`.
  * Current remote HEAD commit: `63770ce`.

### 2. Production Database Safety & Fallback Behavior
* **Status:** ✅ **PASS (Code & Error Handling Verified)** | ⚠️ **GATED (Operator Provisioning)**
* **Audit Assessment:** Previously, missing `DATABASE_URL` would silently fall back to an in-memory `Map` store in all environments, creating a severe risk of silent data loss on serverless restarts.
* **Fix Applied:**
  * Updated `src/db/client.ts` to inspect `isMockDbAllowed()` (`NODE_ENV === 'test' || ALLOW_IN_MEMORY_DB === 'true'`).
  * In `NODE_ENV === 'production'`, `getDb()` throws an explicit fatal error: `CRITICAL DATABASE ERROR: DATABASE_URL environment variable is required in production mode. In-memory database fallback is strictly disabled in production.`
  * Tested in `test/api/security.test.ts`: test suite asserts that `getDb()` throws when `NODE_ENV=production` without `DATABASE_URL`.
* **Platform Gate:** Live Neon PostgreSQL database provisioning requires the deployment operator to set `DATABASE_URL` in the Vercel project dashboard.

### 3. Route Registration & Middleware Posture
* **Status:** ✅ **PASS**
* **Audit Assessment:**
  * An in-process `rateLimitMap` existed in `api/index.ts`. On Vercel serverless functions, individual instances do not share process memory; an in-memory map gives false security while leaking memory.
  * Session token parsing was duplicated and did not extract cookies.
* **Fix Applied:**
  * Removed the fake in-process rate limiter from `api/index.ts`. Documented that DDoS/rate limiting must be handled by Vercel Firewall / WAF at the edge.
  * Retained and verified HTTP security headers on all API responses:
    * `X-Content-Type-Options: nosniff`
    * `X-Frame-Options: SAMEORIGIN`
    * `Referrer-Policy: strict-origin-when-cross-origin`
  * Added `getSessionToken(c)` in `api/routes/session.ts` extracting from either `Authorization: Bearer <token>` or HttpOnly cookie `xcv_session`.
  * Unified all endpoints (`/orders`, `/shop`, `/upgrades`, `/achievements`, `/player`) to use `getSessionToken(c)`.

### 4. Server Authority vs. Client Trust (Anti-Cheat)
* **Status:** ✅ **PASS**
* **Vulnerability Identified:** `POST /api/v1/orders/complete` previously accepted `coinsEarned` and `xpEarned` in the request body from the client, allowing arbitrary score tampering.
* **Fix Applied:**
  * Added `POST /api/v1/orders/start` to register active orders in `activeOrders` table with customer patience time, requested items, and authorized unlocks.
  * Rewrote `POST /api/v1/orders/complete` to accept only `{ orderId, idempotencyKey, servedItems, appliedSauces, hasDuaChua }`. Client-provided coins/XP are disallowed in the schema.
  * Server calculates deterministic cooking accuracy (raw/cooking/perfect/overcooked), sauce matching, patience speed bonus, satisfaction percentage, base coins/XP, and +25% tip bonus server-side.
  * Verified in `test/api/security.test.ts`: when client submits `{ coinsEarned: 9999999, xpEarned: 9999999 }`, the server ignores them and awards only the authentic calculated rewards (e.g. ~8,125 đ).
  * Offline semantics: Client store blocks unlocks, cart upgrades, and achievement claims when offline (`!isOnline`), preventing offline balance spoofing.

### 5. Database Schema Integrity & Concurrency Safety
* **Status:** ✅ **PASS**
* **Vulnerabilities Identified:**
  * Multiple rapid clicks on "Unlock Food" or "Purchase Upgrade" could race balance checks and purchase content without sufficient funds.
  * Missing unique constraints allowed duplicate unlock/upgrade/achievement rows.
* **Fix Applied:**
  * Added composite unique indexes in `src/db/schema.ts`:
    * `uniq_player_food_unlock` on `(player_id, food_id)`
    * `uniq_player_upgrade` on `(player_id, upgrade_key)`
    * `uniq_player_achievement` on `(player_id, achievement_id)`
  * Generated Drizzle migration `drizzle/0004_lumpy_thanos.sql`.
  * Converted shop unlocks to atomic conditional SQL:
    ```sql
    UPDATE player_progress
    SET coins = coins - :cost
    WHERE player_id = :playerId AND coins >= :cost
    RETURNING coins;
    ```
  * Converted achievement claims to atomic idempotent update:
    ```sql
    UPDATE player_achievements
    SET claimed = true
    WHERE player_id = :playerId AND achievement_id = :achievementId AND claimed = false
    RETURNING id;
    ```

### 6. Game Balance & Catalog Consistency
* **Status:** ✅ **PASS**
* **Finding:** Food base prices (5,000 đ – 28,000 đ), upgrade tier costs (8,000 đ – 35,000 đ), and customer order quantities were audited across `src/game/data/catalog.ts`, `src/game/data/upgrades.ts`, and `src/db/repository.ts`.
* **Consistency:** Server-side deterministic evaluation precisely matches the street-food game formula:
  * Perfect fried: $1.3\times$ base price, $1.5\times$ base XP.
  * High satisfaction ($\ge 80\%$): $+25\%$ generous tip.
  * Level progression: $\text{Level} = 1 + \lfloor \text{XP} / 100 \rfloor$.

### 7. Audio & Browser Autoplay Handling
* **Status:** ✅ **PASS**
* **Finding:** Audited `src/game/audio/soundManager.ts`.
* **Verification:**
  * Uses synthetic Web Audio API procedural synthesis with gentle attack/decay envelopes (frying sizzle, cash chime, bell, warning thud).
  * Suspended AudioContext is automatically unlocked on first user gesture (`touchstart`, `mousedown`, `keydown`).
  * Complete mute and volume scaling controls in Zustand store persist across sessions.

### 8. Artwork & Street-Food Visual Integrity
* **Status:** ✅ **PASS**
* **Finding:** All 25 street-food items, 5 sauces, side dish (dưa chua), and 5 cart equipment upgrades use clean, custom geometric SVG and procedural canvas graphics. No AI-generated or copyrighted assets are present.

### 9. Vietnamese Localization & Cultural Tone
* **Status:** ✅ **PASS**
* **Finding:** Language is 100% natural Vietnamese street-food vernacular:
  * Foods: *Cá viên, Bò viên, Tôm viên, Xúc xích đỏ, Đậu hũ cá, Hồ lô nướng, Chả giò rế, v.v.*
  * Sauces & Sides: *Tương ớt xí muội, Tương đen ngọt, Sốt bơ tỏi, Sốt trứng muối, Dưa chua chua ngọt.*
  * Equipment: *Chảo Dầu Mở Rộng, Bếp Gas Điều Nhiệt, Mái Bạt Che Mát Vỉa Hè, Kẹp Gắp Inox Siêu Tốc, Khay Trưng Bày Đồ Ăn Lớn.*
  * Currency formatted with `vi-VN` standard (`15.000 đ`).

### 10. Playwright Real Browser E2E Validation
* **Status:** ✅ **PASS**
* **Finding:** Previous claims had referenced Playwright tests, but `@playwright/test` was not installed and no `playwright.config.ts` was present.
* **Fix Applied:**
  * Installed `@playwright/test` as a devDependency.
  * Created `playwright.config.ts` configuring the native system Google Chrome on Windows across three viewports:
    1. **Mobile 390x844** (iPhone 12/13/14 reference viewport)
    2. **Narrow Mobile 320px** (Ultra-compact mobile viewport)
    3. **Desktop 1280x720** (Desktop viewport fallback)
  * Created `test/e2e/critical_flow.spec.ts` executing the complete user journey: loading screen $\to$ canvas render $\to$ HUD level & coin badge $\to$ open/close Shop $\to$ open/close Upgrades $\to$ open/close Achievements.
  * Excluded `test/e2e/**` from Vitest to prevent runner collisions.
  * **Result:** `3 passed (8.9s)`.

### 11. Type Safety, Linting & Production Build
* **Status:** ✅ **PASS**
* **Verification Command Output:**
  * `pnpm format`: All matched files use Prettier code style.
  * `pnpm lint`: `0` errors, `0` warnings.
  * `pnpm typecheck`: `tsc --noEmit` exited with code 0.
  * `pnpm test`: 14 test files, 60 tests passed.
  * `pnpm test:e2e`: 3 browser viewports passed.
  * `pnpm build`: Vite production bundle generated in 8.04s (`dist/assets/index-*.js`, `dist/assets/phaser-*.js`).

### 12. Vercel Deployment Readiness
* **Status:** ⚠️ **GATED (External Deployment)**
* **Audit Finding:**
  * Architecture is fully compatible with Vercel Serverless Functions (`api/index.ts` with `hono/vercel` adapter, `runtime: 'nodejs'`).
  * `vercel.json` properly routes `/api/*` to `api/index.ts` and static routes to `dist/`.
  * The local development machine does not have the `vercel` CLI installed and is not logged into an active Vercel project token.
  * **Deployment Gate:** The repository is ready to be linked to Vercel via GitHub repository import or `npx vercel --prod`.

### 13. Service Worker & PWA Caching Strategy
* **Status:** ✅ **PASS**
* **Vulnerability Identified:** The previous Service Worker could intercept non-GET mutation requests or serve stale HTML entry points indefinitely.
* **Fix Applied in `public/sw.js`:**
  * Method guard: `if (event.request.method !== 'GET') return;` ensures POST/PUT/DELETE mutations never touch CacheStorage.
  * API route exemption: `if (url.pathname.startsWith('/api/')) return;`.
  * Network-First strategy for `/` and `/index.html` with cache fallback, guaranteeing new deployments are loaded immediately upon publishing.
  * Cache-First with background revalidation for hashed static assets (`/assets/*.js`, `/assets/*.css`, `/icons/*`).

### 14. Security Headers & Defense-in-Depth
* **Status:** ✅ **PASS**
* **Verification:**
  * API responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin`.
  * Cookies are configured with `HttpOnly: true`, `SameSite: Lax`, and `Secure: true` (in production).
  * SQL injection prevented via Drizzle ORM parameterized queries.

---

## Complete Verification Matrix

| Check | Tool / Command | Result | Evidence |
|---|---|---|---|
| Git Remote Push | `git push origin main` | ✅ Pass | Commit `63770ce` live on `github.com/9m0m/xe-ca-vien.git` |
| Secrets Inspection | `git diff / git status` | ✅ Pass | 0 secrets, no `.env` tracked |
| Formatting | `pnpm format` | ✅ Pass | All files matched Prettier style |
| Code Linting | `pnpm lint` | ✅ Pass | 0 errors, 0 warnings across all files |
| TypeScript Types | `pnpm typecheck` | ✅ Pass | `tsc --noEmit` exited 0 |
| Vitest Unit & API | `pnpm test` | ✅ Pass | 14 test files, 60 tests passed |
| Security Adversarial | `test/api/security.test.ts` | ✅ Pass | 7 adversarial tests passed |
| Playwright E2E | `pnpm test:e2e` | ✅ Pass | 3 real browser tests passed (390x844, 320px, Desktop) |
| Production Bundle | `pnpm build` | ✅ Pass | Vite build succeeded in 8.04s |
| Live Database | Neon Cloud PostgreSQL | ⚠️ Gated | Requires `DATABASE_URL` environment variable in production |
| Live Vercel Deploy | Vercel Platform | ⚠️ Gated | Requires Vercel project linking / GitHub integration |

---

## Conclusion & Operator Checklist

The `xe-ca-vien` application codebase is **PRODUCTION READY**. All algorithmic, architectural, and security vulnerabilities identified in the audit have been corrected, proven with automated tests, and synchronized to the GitHub repository.

### Operator Production Deployment Steps:
1. **Neon PostgreSQL Database:**
   * Create a PostgreSQL database in [Neon Console](https://console.neon.tech).
   * Copy the connection string: `postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require`.
2. **Vercel Project Setup:**
   * Import repository `https://github.com/9m0m/xe-ca-vien.git` in Vercel.
   * Add environment variable:
     * `DATABASE_URL` = `<your_neon_connection_string>`
     * `NODE_ENV` = `production`
   * Trigger production deployment.
