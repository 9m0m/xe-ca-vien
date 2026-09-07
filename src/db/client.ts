import { neon, Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    return null
  }
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export function getNeonPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    return null
  }
  return new Pool({ connectionString })
}
