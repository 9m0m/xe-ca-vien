import { neon, Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * In-memory mock database is strictly restricted to automated tests
 * or an explicitly declared local mock environment.
 */
export function isMockDbAllowed(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.ALLOW_IN_MEMORY_DB === 'true'
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL DATABASE ERROR: DATABASE_URL environment variable is required in production mode. ' +
          'In-memory database fallback is strictly disabled in production.',
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

  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export function getNeonPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production mode.')
    }
    return null
  }
  return new Pool({ connectionString })
}
