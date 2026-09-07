import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

/**
 * Strips sensitive credentials from a database connection string for safe console logging.
 */
function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.password = '***'
    return parsed.toString()
  } catch {
    return '[PROTECTED_DATABASE_URL]'
  }
}

export async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('CRITICAL ERROR: DATABASE_URL environment variable is missing.')
    console.error(
      'Cannot execute production database migrations without a valid database connection.',
    )
    process.exit(1)
  }

  const sanitized = sanitizeDatabaseUrl(connectionString)
  console.log(`[db:migrate] Target: ${sanitized}`)
  console.log('[db:migrate] Connecting via Neon connection pool...')

  const pool = new Pool({ connectionString })
  const db = drizzle(pool)

  try {
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle')
    console.log(`[db:migrate] Reading migration journal from: ${migrationsFolder}`)

    // Applies all pending migrations in order (0000 -> 0004 -> latest)
    // Drizzle tracks applied migrations in the __drizzle_migrations table automatically.
    await migrate(db, { migrationsFolder })

    console.log('[db:migrate] All ordered migrations applied successfully.')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[db:migrate] Migration execution failed:', message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Execute directly if run via CLI (tsx src/db/migrate.ts)
if (process.argv[1]?.includes('migrate')) {
  runMigrations()
}
