import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  text,
  index,
} from 'drizzle-orm/pg-core'

// 1. Players Table
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: varchar('display_name', { length: 64 }).notNull(),
  isGuest: boolean('is_guest').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// 2. Player Sessions (Opaque server-issued token)
export const playerSessions = pgTable(
  'player_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    sessionToken: varchar('session_token', { length: 128 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    sessionTokenIdx: index('idx_player_sessions_token').on(table.sessionToken),
  }),
)

// 3. Player Progress (Authoritative balances)
export const playerProgress = pgTable('player_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id')
    .notNull()
    .unique()
    .references(() => players.id, { onDelete: 'cascade' }),
  coins: integer('coins').notNull().default(0),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  reputation: integer('reputation').notNull().default(100),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// 4. Food Unlocks
export const playerFoodUnlocks = pgTable(
  'player_food_unlocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    foodId: varchar('food_id', { length: 64 }).notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    playerFoodIdx: index('idx_player_food_unlocks').on(table.playerId, table.foodId),
  }),
)

// 5. Player Upgrades
export const playerUpgrades = pgTable(
  'player_upgrades',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    upgradeKey: varchar('upgrade_key', { length: 64 }).notNull(),
    tier: integer('tier').notNull().default(1),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    playerUpgradeIdx: index('idx_player_upgrades').on(table.playerId, table.upgradeKey),
  }),
)

// 6. Order Runs (Auditing & Idempotent Rewards)
export const orderRuns = pgTable(
  'order_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull().unique(),
    status: varchar('status', { length: 32 }).notNull().default('completed'),
    itemsJson: text('items_json').notNull(),
    coinsAwarded: integer('coins_awarded').notNull().default(0),
    xpAwarded: integer('xp_awarded').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idempotencyIdx: index('idx_order_runs_idempotency').on(table.idempotencyKey),
  }),
)

// 7. Player Stats (Orders, perfect fries, total revenue)
export const playerStats = pgTable('player_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id')
    .notNull()
    .unique()
    .references(() => players.id, { onDelete: 'cascade' }),
  ordersServed: integer('orders_served').notNull().default(0),
  perfectItemsFried: integer('perfect_items_fried').notNull().default(0),
  totalCoinsEarned: integer('total_coins_earned').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// 8. Player Achievements
export const playerAchievements = pgTable(
  'player_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    achievementId: varchar('achievement_id', { length: 64 }).notNull(),
    claimed: boolean('claimed').notNull().default(false),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    playerAchievementIdx: index('idx_player_achievements').on(table.playerId, table.achievementId),
  }),
)
