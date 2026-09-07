# Production Deployment Guide: Xe Cá Viên

This guide outlines the procedure for deploying `xe-ca-vien` to **Vercel** with a **Neon PostgreSQL** serverless database.

---

## 1. Prerequisites

Before deploying, ensure you have:

- A [GitHub](https://github.com) account with write access to `https://github.com/9m0m/xe-ca-vien.git`.
- A [Neon Database](https://neon.tech) account.
- A [Vercel](https://vercel.com) account.
- Node.js v20+ and `pnpm` installed locally.

---

## 2. Neon PostgreSQL Database Provisioning

### Step 2.1: Create Project

1. Log in to the [Neon Console](https://console.neon.tech).
2. Click **New Project**.
3. Set **Project Name** to `xe-ca-vien-db`.
4. Select your preferred AWS region (e.g., `ap-southeast-1` Singapore for lowest latency in Vietnam).
5. Leave PostgreSQL version as `16` (or latest supported).
6. Click **Create Project**.

### Step 2.2: Retrieve Connection Strings

Neon provides two connection options:

- **Pooled connection string (Recommended for serverless):**  
  `postgresql://[user]:[password]@[endpoint]-pooler.[region].neon.tech/neondb?sslmode=require`
- **Direct connection string:**  
  `postgresql://[user]:[password]@[endpoint].[region].neon.tech/neondb?sslmode=require`

> [!IMPORTANT]
> Use the **Pooled connection string** (contains `-pooler`) for Vercel serverless functions to ensure efficient connection management under high concurrency.

---

## 3. Database Migration Execution (`pnpm db:migrate`)

The migration runner reads the ordered journal from `./drizzle` and applies pending migrations using PostgreSQL transactions.

### Ordered Migration Chain

1. `0000_steep_night_nurse.sql`: Core tables (`players`, `player_sessions`, `player_progress`, `player_food_unlocks`, `player_upgrades`, `player_stats`).
2. `0001_complex_echo.sql`: Active orders and order runs (`active_orders`, `order_runs`).
3. `0002_steep_galactus.sql`: Achievement tracking (`player_achievements`).
4. `0003_yummy_mach_iv.sql`: Timestamps and idempotency key indexes.
5. `0004_lumpy_thanos.sql`: Composite unique indexes (`uniq_player_food_unlock`, `uniq_player_upgrade`, `uniq_player_achievement`).

### Running Migrations

#### Option A: Fresh Database Initialization

When connecting to a brand-new Neon database for the first time:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.neon.tech/neondb?sslmode=require"
pnpm db:migrate

# Linux / macOS / Bash
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.neon.tech/neondb?sslmode=require" pnpm db:migrate
```

Expected output:

```text
[db:migrate] Target: postgresql://[user]:***@[endpoint]-pooler.neon.tech/neondb?sslmode=require
[db:migrate] Connecting via Neon connection pool...
[db:migrate] Reading migration journal from: /path/to/drizzle
[db:migrate] All ordered migrations applied successfully.
```

#### Option B: Upgrading an Existing Database

Drizzle automatically creates and tracks applied migrations in the `__drizzle_migrations` table.
Running `pnpm db:migrate` on an already-migrated database will only apply newer unapplied migrations. Existing data is preserved.

---

## 4. Environment Variables Reference

Configure these variables in your Vercel Project Settings (**Settings** $\to$ **Environment Variables**):

| Variable Name        | Environment         | Required? | Example / Default                                                       | Description & Security Note                                                                         |
| -------------------- | ------------------- | --------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Production, Preview | **YES**   | `postgresql://user:pass@ep-xyz-pooler.neon.tech/neondb?sslmode=require` | Neon pooled connection string. **NEVER** commit this to git.                                        |
| `NODE_ENV`           | Production          | **YES**   | `production`                                                            | Enables production security enforcement. When `production`, mock DB fallback is completely blocked. |
| `ALLOW_IN_MEMORY_DB` | Local Dev only      | NO        | `true`                                                                  | Allows in-memory database fallback for offline local development only. Ignored in production.       |

---

## 5. Vercel Deployment Guide

### Step 5.1: Import Project into Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** $\to$ **Project**.
3. Import the GitHub repository: `9m0m/xe-ca-vien`.
4. Configure Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`

### Step 5.2: Configure Environment Variables

Add the environment variables in the Vercel deployment modal:

- `DATABASE_URL` = `<your_neon_pooled_connection_string>`
- `NODE_ENV` = `production`

### Step 5.3: Deploy

1. Click **Deploy**.
2. Vercel will build the frontend assets, compile TypeScript, and prepare the Serverless Function at `/api`.
3. Upon completion, note your deployment URL: `https://xe-ca-vien-[hash].vercel.app` (or custom domain).

---

## 6. Post-Deployment Smoke Testing (`pnpm smoke`)

After deploying, verify the deployment end-to-end using the automated smoke script:

```bash
# Run smoke test against your live Vercel URL
pnpm smoke --url https://xe-ca-vien.vercel.app
```

The script executes a 6-step verification without printing any secrets:

1. **Step 1: Root Page HTML Shell** (Verifies 200 OK, title, viewport tags).
2. **Step 2: Initialize Guest Session** (Verifies 10,000 đ starter balance, HttpOnly cookie set).
3. **Step 3: Authenticate & Fetch Player Profile** (Verifies session authentication).
4. **Step 4: Register Active Order** (Verifies `/orders/start`).
5. **Step 5: Complete Order** (Verifies server-authoritative scoring & coin award).
6. **Step 6: Verify Persistence on Re-fetch** (Verifies database persistence).

Expected Output:

```text
============================================================
XE CA VIEN — DEPLOYMENT SMOKE TEST
Target URL: https://xe-ca-vien.vercel.app
Timestamp:  2026-09-07T13:15:00.000Z
============================================================
[PASS] Step 1: Root Page HTML Shell (82ms)
[PASS] Step 2: Initialize Guest Session (Starter Capital) (180ms)
[PASS] Step 3: Authenticate & Fetch Player Profile (45ms)
[PASS] Step 4: Register Active Order (38ms)
[PASS] Step 5: Complete Order (Server-Authoritative Economy) (52ms)
[PASS] Step 6: Verify Persistence on Re-fetch (35ms)
============================================================
RESULT: ALL 6 SMOKE CHECKS PASSED [READY]
============================================================
```

---

## 7. Rollback & Disaster Recovery Procedure

If an issue occurs in production:

### Instant Frontend / API Rollback

1. In the Vercel dashboard, navigate to **Deployments**.
2. Find the previous stable deployment.
3. Click the three dots menu `...` $\to$ **Instant Rollback**.
4. Vercel will immediately route traffic back to the prior build within seconds without rebuilding.

### Database Disaster Recovery

1. **Neon Point-in-Time Recovery (PITR):**
   - Neon maintains continuous write-ahead log (WAL) archiving.
   - In Neon Console, navigate to **Branches**.
   - Create a branch from a specific timestamp prior to the incident.
   - Update `DATABASE_URL` in Vercel to point to the restored branch.
2. **Schema Rollback:**
   - If a migration failed, inspect the `__drizzle_migrations` table in Neon SQL Editor:
     ```sql
     SELECT * FROM __drizzle_migrations ORDER BY created_at DESC;
     ```
   - Rollback scripts can be executed directly via the SQL Editor or custom migration script if needed.
