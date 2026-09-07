import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'
// Configure WebSocket for environments where global WebSocket is missing (legacy Node.js).
// Modern Node (>=22) and Vercel Edge runtime provide global WebSocket natively.
if (typeof WebSocket === 'undefined') {
  try {
    const wsModule = await import('ws')
    neonConfig.webSocketConstructor = wsModule.default || wsModule
  } catch {
    // Edge runtime / browser environments have native WebSocket support
  }
}

let cachedPool: Pool | null = null

/**
 * In-memory mock database is strictly restricted to automated tests
 * or an explicitly declared local mock environment.
 */
export function isMockDbAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY_DB === 'true'
}

export function getNeonPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production mode.')
    }
    return null
  }
  if (!cachedPool) {
    cachedPool = new Pool({ connectionString })
  }
  return cachedPool
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL DATABASE ERROR: DATABASE_URL environment variable is required in production mode. ' +
          'In-memory database fallback is strictly disabled in production regardless of ALLOW_IN_MEMORY_DB.',
      )
    }

    if (!isMockDbAllowed()) {
      throw new Error(
        'DATABASE_URL environment variable is missing. ' +
          'Set ALLOW_IN_MEMORY_DB=true for local offline development or run under NODE_ENV=test.',
      )
    }

    return null
  }

  const pool = getNeonPool()
  if (!pool) return null
  return drizzle(pool, { schema })
}
