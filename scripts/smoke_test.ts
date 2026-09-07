/**
 * Deployment Smoke Test Script
 * Validates a live preview or production deployment against the critical server flow.
 *
 * Usage:
 *   pnpm smoke
 *   pnpm smoke --url https://xe-ca-vien.vercel.app
 *   DEPLOY_URL=https://xe-ca-vien.vercel.app pnpm smoke
 */

function parseTargetUrl(): string {
  const args = process.argv.slice(2)
  const urlArgIdx = args.findIndex((arg) => arg === '--url' || arg === '-u')
  if (urlArgIdx !== -1 && args[urlArgIdx + 1]) {
    return args[urlArgIdx + 1].replace(/\/$/, '')
  }
  return (process.env.DEPLOY_URL || 'http://localhost:4173').replace(/\/$/, '')
}

interface StepResult {
  step: number
  name: string
  durationMs: number
  passed: boolean
  error?: string
}

async function runSmokeTest() {
  const baseUrl = parseTargetUrl()
  console.log('='.repeat(60))
  console.log(`XE CA VIEN — DEPLOYMENT SMOKE TEST`)
  console.log(`Target URL: ${baseUrl}`)
  console.log(`Timestamp:  ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  const results: StepResult[] = []
  let sessionCookie: string | null = null
  let sessionToken: string | null = null
  let playerId: string | null = null
  let orderId: string | null = null
  let earnedCoins = 0

  async function executeStep(step: number, name: string, fn: () => Promise<void>) {
    const start = performance.now()
    try {
      await fn()
      const durationMs = Math.round(performance.now() - start)
      results.push({ step, name, durationMs, passed: true })
      console.log(`[PASS] Step ${step}: ${name} (${durationMs}ms)`)
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - start)
      const error = err instanceof Error ? err.message : String(err)
      results.push({ step, name, durationMs, passed: false, error })
      console.error(`[FAIL] Step ${step}: ${name} (${durationMs}ms) - ${error}`)
    }
  }

  function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie
    }
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`
    }
    return headers
  }

  // 1. Root page loads with 200 and expected HTML title
  await executeStep(1, 'Root Page HTML Shell', async () => {
    const res = await fetch(`${baseUrl}/`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const html = await res.text()
    if (!html.includes('<title>') || !html.toLowerCase().includes('cá viên')) {
      throw new Error('Response HTML missing valid game title')
    }
  })

  // 2. POST /api/v1/session/guest returns 200, valid session, starter coins = 10,000
  await executeStep(2, 'Initialize Guest Session (Starter Capital)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/session/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

    // Capture Set-Cookie if present
    const rawCookie = res.headers.get('set-cookie')
    if (rawCookie) {
      sessionCookie = rawCookie.split(';')[0]
    }

    const body = await res.json()
    if (!body.success || !body.data) {
      throw new Error(`Guest session init failed: ${JSON.stringify(body.error)}`)
    }

    sessionToken = body.data.sessionToken
    playerId = body.data.player.id

    if (body.data.progress.coins !== 10000) {
      throw new Error(`Expected starter capital 10,000 đ, got ${body.data.progress.coins}`)
    }
  })

  // 3. GET /api/v1/player returns profile with matching credentials
  await executeStep(3, 'Authenticate & Fetch Player Profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/player`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const body = await res.json()
    if (!body.success || body.data.player.id !== playerId) {
      throw new Error('Player profile ID mismatch or unauthenticated')
    }
  })

  // 4. POST /api/v1/orders/start registers an active order
  await executeStep(4, 'Register Active Order', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        preferredItems: [
          { foodId: 'fish_ball_classic', quantity: 2 },
          { foodId: 'sausage_red', quantity: 1 },
        ],
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const body = await res.json()
    if (!body.success || !body.data?.id) {
      throw new Error('Order creation did not return a valid order ID')
    }
    orderId = body.data.id
  })

  // 5. POST /api/v1/orders/complete executes server-authoritative reward calculation
  await executeStep(5, 'Complete Order (Server-Authoritative Economy)', async () => {
    if (!orderId) throw new Error('No active order ID from previous step')
    const idempotencyKey = `smoke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const res = await fetch(`${baseUrl}/api/v1/orders/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        orderId,
        idempotencyKey,
        servedItems: [
          { foodId: 'fish_ball_classic', state: 'perfect' },
          { foodId: 'fish_ball_classic', state: 'perfect' },
          { foodId: 'sausage_red', state: 'perfect' },
        ],
        appliedSauces: ['tuong_ot'],
        hasDuaChua: true,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const body = await res.json()
    if (!body.success || !body.data) {
      throw new Error(`Order completion failed: ${JSON.stringify(body.error)}`)
    }
    if (body.data.coinsAwarded <= 0) {
      throw new Error('Server awarded zero coins for a completed order')
    }
    earnedCoins = body.data.coinsAwarded
    if (body.data.newTotalCoins !== 10000 + earnedCoins) {
      throw new Error(
        `Balance mismatch: expected ${10000 + earnedCoins}, got ${body.data.newTotalCoins}`,
      )
    }
  })

  // 6. GET /api/v1/player verifies persistence across HTTP requests
  await executeStep(6, 'Verify Persistence on Re-fetch', async () => {
    const res = await fetch(`${baseUrl}/api/v1/player`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const body = await res.json()
    if (!body.success) throw new Error('Player profile retrieval failed')
    const expectedCoins = 10000 + earnedCoins
    if (body.data.progress.coins !== expectedCoins) {
      throw new Error(
        `Persistent balance mismatch: expected ${expectedCoins}, got ${body.data.progress.coins}`,
      )
    }
  })

  console.log('='.repeat(60))
  const failedCount = results.filter((r) => !r.passed).length
  if (failedCount === 0) {
    console.log(`RESULT: ALL 6 SMOKE CHECKS PASSED [READY]`)
    console.log('='.repeat(60))
    process.exit(0)
  } else {
    console.error(`RESULT: ${failedCount} CHECK(S) FAILED [NOT READY]`)
    console.log('='.repeat(60))
    process.exit(1)
  }
}

runSmokeTest()
