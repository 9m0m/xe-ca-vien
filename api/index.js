var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/index.ts
import { Hono as Hono7 } from "hono";
import { z as z5 } from "zod";

// api/routes/session.ts
import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";

// src/db/repository.ts
import { eq, and, sql } from "drizzle-orm";

// src/db/client.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activeOrders: () => activeOrders,
  orderRuns: () => orderRuns,
  playerAchievements: () => playerAchievements,
  playerFoodUnlocks: () => playerFoodUnlocks,
  playerProgress: () => playerProgress,
  playerSessions: () => playerSessions,
  playerStats: () => playerStats,
  playerUpgrades: () => playerUpgrades,
  players: () => players
});
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  text,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
var players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  isGuest: boolean("is_guest").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var playerSessions = pgTable(
  "player_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 128 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    sessionTokenIdx: index("idx_player_sessions_token").on(table.sessionToken)
  })
);
var playerProgress = pgTable("player_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().unique().references(() => players.id, { onDelete: "cascade" }),
  coins: integer("coins").notNull().default(0),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  reputation: integer("reputation").notNull().default(100),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var playerFoodUnlocks = pgTable(
  "player_food_unlocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    foodId: varchar("food_id", { length: 64 }).notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    playerFoodIdx: index("idx_player_food_unlocks").on(table.playerId, table.foodId),
    uniqPlayerFood: uniqueIndex("uniq_player_food_unlock").on(table.playerId, table.foodId)
  })
);
var playerUpgrades = pgTable(
  "player_upgrades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    upgradeKey: varchar("upgrade_key", { length: 64 }).notNull(),
    tier: integer("tier").notNull().default(1),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    playerUpgradeIdx: index("idx_player_upgrades").on(table.playerId, table.upgradeKey),
    uniqPlayerUpgrade: uniqueIndex("uniq_player_upgrade").on(table.playerId, table.upgradeKey)
  })
);
var activeOrders = pgTable(
  "active_orders",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    itemsJson: text("items_json").notNull(),
    requestedSaucesJson: text("requested_sauces_json").notNull(),
    hasDuaChua: boolean("has_dua_chua").notNull().default(false),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    patienceMs: integer("patience_ms").notNull().default(6e4)
  },
  (table) => ({
    activeOrderPlayerIdx: index("idx_active_orders_player").on(table.playerId)
  })
);
var orderRuns = pgTable(
  "order_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull().unique(),
    status: varchar("status", { length: 32 }).notNull().default("completed"),
    itemsJson: text("items_json").notNull(),
    coinsAwarded: integer("coins_awarded").notNull().default(0),
    xpAwarded: integer("xp_awarded").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    idempotencyIdx: index("idx_order_runs_idempotency").on(table.idempotencyKey),
    playerOrderIdx: index("idx_order_runs_player").on(table.playerId)
  })
);
var playerStats = pgTable("player_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().unique().references(() => players.id, { onDelete: "cascade" }),
  ordersServed: integer("orders_served").notNull().default(0),
  perfectItemsFried: integer("perfect_items_fried").notNull().default(0),
  totalCoinsEarned: integer("total_coins_earned").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var playerAchievements = pgTable(
  "player_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    achievementId: varchar("achievement_id", { length: 64 }).notNull(),
    claimed: boolean("claimed").notNull().default(false),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    playerAchievementIdx: index("idx_player_achievements").on(table.playerId, table.achievementId),
    uniqPlayerAchievement: uniqueIndex("uniq_player_achievement").on(
      table.playerId,
      table.achievementId
    )
  })
);

// src/db/client.ts
import ws from "ws";
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}
var cachedPool = null;
function isMockDbAllowed() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.NODE_ENV === "test" || process.env.ALLOW_IN_MEMORY_DB === "true";
}
function getNeonPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is required in production mode.");
    }
    return null;
  }
  if (!cachedPool) {
    cachedPool = new Pool({ connectionString });
  }
  return cachedPool;
}
function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL DATABASE ERROR: DATABASE_URL environment variable is required in production mode. In-memory database fallback is strictly disabled in production regardless of ALLOW_IN_MEMORY_DB."
      );
    }
    if (!isMockDbAllowed()) {
      throw new Error(
        "DATABASE_URL environment variable is missing. Set ALLOW_IN_MEMORY_DB=true for local offline development or run under NODE_ENV=test."
      );
    }
    return null;
  }
  const pool = getNeonPool();
  if (!pool) return null;
  return drizzle(pool, { schema: schema_exports });
}

// src/db/repository.ts
import crypto from "crypto";

// src/game/data/upgrades.ts
var CART_UPGRADES = [
  {
    id: "pan_capacity",
    nameVi: "Ch\u1EA3o D\u1EA7u M\u1EDF R\u1ED9ng",
    shortDescVi: "M\u1EDF r\u1ED9ng s\u1EE9c ch\u1EE9a ch\u1EA3o d\u1EA7u chi\xEAn th\xEAm nhi\u1EC1u xi\xEAn c\xF9ng l\xFAc.",
    iconName: "Flame",
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 6,
        descriptionVi: "S\u1EE9c ch\u1EE9a ti\xEAu chu\u1EA9n: 6 v\u1ECB tr\xED chi\xEAn c\xF9ng l\xFAc."
      },
      {
        tier: 2,
        cost: 15e3,
        levelRequired: 2,
        effectValue: 8,
        descriptionVi: "M\u1EDF r\u1ED9ng ch\u1EA3o: 8 v\u1ECB tr\xED chi\xEAn \u0111\u1ED3ng th\u1EDDi."
      },
      {
        tier: 3,
        cost: 35e3,
        levelRequired: 4,
        effectValue: 10,
        descriptionVi: "Ch\u1EA3o c\xF4ng nghi\u1EC7p \u0111\u1EA1i: 10 v\u1ECB tr\xED chi\xEAn r\u1ED9n r\xE3."
      }
    ]
  },
  {
    id: "oil_thermostat",
    nameVi: "B\u1EBFp Gas \u0110i\u1EC1u Nhi\u1EC7t",
    shortDescVi: "\u1ED4n \u0111\u1ECBnh l\u1EEDa d\u1EA7u, n\u1EDBi r\u1ED9ng kho\u1EA3ng th\u1EDDi gian xi\xEAn ch\xEDn v\xE0ng gi\xF2n r\u1EE5m.",
    iconName: "Clock",
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 0,
        descriptionVi: "Kho\u1EA3ng th\u1EDDi gian ch\xEDn v\xE0ng m\u1EB7c \u0111\u1ECBnh."
      },
      {
        tier: 2,
        cost: 12e3,
        levelRequired: 2,
        effectValue: 1e3,
        descriptionVi: "+1.0 gi\xE2y th\u1EDDi gian v\xE0ng (d\u1EC5 canh xi\xEAn ho\xE0n h\u1EA3o h\u01A1n)."
      },
      {
        tier: 3,
        cost: 28e3,
        levelRequired: 3,
        effectValue: 2e3,
        descriptionVi: "+2.0 gi\xE2y th\u1EDDi gian v\xE0ng (chi\xEAn m\u01B0\u1EE3t m\xE0 kh\xF4ng lo kh\xE9t)."
      }
    ]
  },
  {
    id: "awning_comfort",
    nameVi: "M\xE1i B\u1EA1t Che M\xE1t V\u1EC9a H\xE8",
    shortDescVi: "B\u1EA1t s\u1ECDc che m\xE1t gi\xFAp th\u1EF1c kh\xE1ch vui v\u1EBB ki\xEAn nh\u1EABn \u0111\u1EE3i l\xE2u h\u01A1n.",
    iconName: "ChefHat",
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 0,
        descriptionVi: "Th\u1EDDi gian ki\xEAn nh\u1EABn chu\u1EA9n c\u1EE7a kh\xE1ch."
      },
      {
        tier: 2,
        cost: 1e4,
        levelRequired: 1,
        effectValue: 15e3,
        descriptionVi: "+15 gi\xE2y th\u1EDDi gian kh\xE1ch ki\xEAn nh\u1EABn ch\u1EDD m\xF3n."
      },
      {
        tier: 3,
        cost: 25e3,
        levelRequired: 3,
        effectValue: 3e4,
        descriptionVi: "+30 gi\xE2y th\u1EDDi gian kh\xE1ch ki\xEAn nh\u1EABn ch\u1EDD m\xF3n."
      }
    ]
  },
  {
    id: "speed_tongs",
    nameVi: "K\u1EB9p G\u1EAFp Inox Si\xEAu T\u1ED1c",
    shortDescVi: "K\u1EB9p g\u1EAFp tr\u1EE3 l\u1EF1c g\u1EAFp xi\xEAn c\xE1 vi\xEAn r\xE1o d\u1EA7u l\xEAn d\u0129a c\u1EF1c nhanh.",
    iconName: "Utensils",
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 1,
        descriptionVi: "T\u1ED1c \u0111\u1ED9 g\u1EAFp r\xE1o d\u1EA7u b\xECnh th\u01B0\u1EDDng."
      },
      {
        tier: 2,
        cost: 8e3,
        levelRequired: 2,
        effectValue: 1.5,
        descriptionVi: "T\u0103ng 50% t\u1ED1c \u0111\u1ED9 g\u1EAFp xi\xEAn l\xEAn d\u0129a."
      },
      {
        tier: 3,
        cost: 2e4,
        levelRequired: 3,
        effectValue: 2,
        descriptionVi: "T\u0103ng 100% t\u1ED1c \u0111\u1ED9 g\u1EAFp xi\xEAn (nhanh g\u1EA5p \u0111\xF4i)."
      }
    ]
  },
  {
    id: "tray_expansion",
    nameVi: "Khay Tr\u01B0ng B\xE0y \u0110\u1ED3 \u0102n L\u1EDBn",
    shortDescVi: "Tr\u01B0ng b\xE0y nhi\u1EC1u m\xF3n \u0103n tr\xEAn khay inox h\u01A1n m\xE0 kh\xF4ng c\u1EA7n l\u1EADt trang.",
    iconName: "Layers",
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 4,
        descriptionVi: "4 m\xF3n tr\u01B0ng b\xE0y tr\xEAn khay m\u1ED7i trang."
      },
      {
        tier: 2,
        cost: 18e3,
        levelRequired: 3,
        effectValue: 6,
        descriptionVi: "6 m\xF3n tr\u01B0ng b\xE0y tr\xEAn khay m\u1ED7i trang."
      }
    ]
  }
];
function getUpgradeConfig(upgradeId) {
  return CART_UPGRADES.find((u) => u.id === upgradeId);
}
function getNextUpgradeTier(upgradeId, currentTier) {
  const upgrade = getUpgradeConfig(upgradeId);
  if (!upgrade) return null;
  return upgrade.tiers.find((t) => t.tier === currentTier + 1) || null;
}

// src/game/data/achievements.ts
var ACHIEVEMENTS = [
  {
    id: "first_order",
    titleVi: "Khai Tr\u01B0\u01A1ng Bu\xF4n May",
    descriptionVi: "Ph\u1EE5c v\u1EE5 th\xE0nh c\xF4ng \u0111\u01A1n h\xE0ng \u0111\u1EA7u ti\xEAn cho th\u1EF1c kh\xE1ch v\u1EC9a h\xE8.",
    targetValue: 1,
    metric: "orders",
    rewardCoins: 2e3,
    rewardXp: 50
  },
  {
    id: "orders_10",
    titleVi: "Kh\xE1ch Quen V\u1EC9a H\xE8",
    descriptionVi: "Ph\u1EE5c v\u1EE5 li\xEAn t\u1EE5c 10 l\u01B0\u1EE3t th\u1EF1c kh\xE1ch gh\xE9 xe c\xE1 vi\xEAn.",
    targetValue: 10,
    metric: "orders",
    rewardCoins: 5e3,
    rewardXp: 100
  },
  {
    id: "orders_50",
    titleVi: "B\u1EADc Th\u1EA7y Ch\u1EA3o D\u1EA7u",
    descriptionVi: "Ho\xE0n th\xE0nh 50 \u0111\u01A1n h\xE0ng tr\xEAn ph\u1ED1 \u0103n v\u1EB7t S\xE0i G\xF2n.",
    targetValue: 50,
    metric: "orders",
    rewardCoins: 15e3,
    rewardXp: 300
  },
  {
    id: "perfect_fry_10",
    titleVi: "Tay Chi\xEAn Chu\u1EA9n X\xE1c",
    descriptionVi: "V\u1EDBt 10 xi\xEAn \u0111\u1ED3 \u0103n \u0111\u1EA1t \u0111\u1ED9 ch\xEDn v\xE0ng gi\xF2n ho\xE0n h\u1EA3o.",
    targetValue: 10,
    metric: "perfectFries",
    rewardCoins: 3e3,
    rewardXp: 80
  },
  {
    id: "perfect_fry_50",
    titleVi: "\u0110\u1EC7 Nh\u1EA5t C\xE1 Vi\xEAn",
    descriptionVi: "V\u1EDBt 50 xi\xEAn \u0111\u1ED3 \u0103n \u0111\u1EA1t \u0111\u1ED9 ch\xEDn v\xE0ng gi\xF2n r\u1EE5m kh\xF4ng m\u1ED9t v\u1EBFt kh\xE9t.",
    targetValue: 50,
    metric: "perfectFries",
    rewardCoins: 1e4,
    rewardXp: 250
  },
  {
    id: "menu_expand_10",
    titleVi: "Th\u1EF1c \u0110\u01A1n Phong Ph\xFA",
    descriptionVi: "M\u1EDF kh\xF3a t\u1EEB 10 m\xF3n \u0103n v\u1EB7t kh\xE1c nhau trong b\u1ED9 s\u01B0u t\u1EADp xe.",
    targetValue: 10,
    metric: "foodsUnlocked",
    rewardCoins: 6e3,
    rewardXp: 150
  },
  {
    id: "first_upgrade",
    titleVi: "N\xE2ng C\u1EA5p C\u01A1 Ng\u01A1i",
    descriptionVi: "N\xE2ng c\u1EA5p chi\u1EBFc xe c\xE1 vi\xEAn v\u1EDBi trang thi\u1EBFt b\u1ECB ti\u1EC7n nghi \u0111\u1EA7u ti\xEAn.",
    targetValue: 1,
    metric: "upgrades",
    rewardCoins: 2e3,
    rewardXp: 60
  },
  {
    id: "rich_vendor",
    titleVi: "\u0110\u1EA1i Gia V\u1EC9a H\xE8",
    descriptionVi: "T\xEDch l\u0169y \u0111\u1EA1t m\u1ED1c 50.000\u0111 trong h\u0169 ti\u1EC1n bu\xF4n b\xE1n.",
    targetValue: 5e4,
    metric: "coins",
    rewardCoins: 1e4,
    rewardXp: 200
  }
];
function checkAchievementUnlocked(achievement, stats, currentCoins) {
  switch (achievement.metric) {
    case "orders":
      return stats.ordersServed >= achievement.targetValue;
    case "perfectFries":
      return stats.perfectItemsFried >= achievement.targetValue;
    case "foodsUnlocked":
      return stats.foodsUnlockedCount >= achievement.targetValue;
    case "upgrades":
      return stats.upgradesPurchasedCount >= achievement.targetValue;
    case "coins":
      return currentCoins >= achievement.targetValue;
    default:
      return false;
  }
}

// src/game/data/catalog.ts
var FULL_FOOD_CATALOG = [
  // A. Classic viên (1-18)
  {
    id: "fish_ball_classic",
    displayNameVi: "C\xE1 vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 5e3,
    baseReward: 20,
    unlockTier: 1,
    spriteKey: "fish_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "fish_ball_flat",
    displayNameVi: "C\xE1 vi\xEAn d\u1EB9t",
    category: "vien",
    shapeProfile: "flat",
    cookTimeMs: 3500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2500,
    basePrice: 5500,
    baseReward: 22,
    unlockTier: 2,
    spriteKey: "shape_flat_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "fish_ball_vegetable",
    displayNameVi: "C\xE1 vi\xEAn rau c\u1EE7",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 6e3,
    baseReward: 25,
    unlockTier: 2,
    spriteKey: "shape_round_herb",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "fish_ball_green_rice",
    displayNameVi: "C\xE1 vi\xEAn c\u1ED1m xanh",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 7e3,
    baseReward: 28,
    unlockTier: 3,
    spriteKey: "shape_round_herb",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fish_ball_quail_egg",
    displayNameVi: "C\xE1 vi\xEAn tr\u1EE9ng c\xFAt",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 5e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 8e3,
    baseReward: 32,
    unlockTier: 4,
    spriteKey: "fish_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fish_ball_mayo",
    displayNameVi: "C\xE1 vi\xEAn s\u1ED1t mayo",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 8e3,
    baseReward: 32,
    unlockTier: 4,
    spriteKey: "fish_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["mayo", "tuong_ot"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "beef_ball_classic",
    displayNameVi: "B\xF2 vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 6e3,
    baseReward: 25,
    unlockTier: 1,
    spriteKey: "beef_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den", "sa_te"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "beef_ball_pepper",
    displayNameVi: "B\xF2 vi\xEAn ti\xEAu",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 5e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 7e3,
    baseReward: 28,
    unlockTier: 2,
    spriteKey: "beef_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "shrimp_ball_classic",
    displayNameVi: "T\xF4m vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 6e3,
    baseReward: 25,
    unlockTier: 1,
    spriteKey: "shape_round_orange",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "squid_ball_classic",
    displayNameVi: "M\u1EF1c vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4200,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 7e3,
    baseReward: 28,
    unlockTier: 2,
    spriteKey: "fish_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "squid_ball_vegetable",
    displayNameVi: "M\u1EF1c vi\xEAn rau c\u1EE7",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 7500,
    baseReward: 30,
    unlockTier: 3,
    spriteKey: "shape_round_herb",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "seafood_ball",
    displayNameVi: "H\u1EA3i s\u1EA3n vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 7500,
    baseReward: 30,
    unlockTier: 3,
    spriteKey: "shape_round_orange",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "scallop_ball",
    displayNameVi: "S\xF2 \u0111i\u1EC7p vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 9e3,
    baseReward: 36,
    unlockTier: 4,
    spriteKey: "fish_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "lobster_ball",
    displayNameVi: "T\xF4m h\xF9m vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 5e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 12e3,
    baseReward: 48,
    unlockTier: 5,
    spriteKey: "shape_round_orange",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "cheese_ball",
    displayNameVi: "Ph\xF4 mai vi\xEAn",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4e3,
    perfectWindowMs: 2500,
    overcookTimeMs: 2500,
    basePrice: 8e3,
    baseReward: 32,
    unlockTier: 3,
    spriteKey: "shape_round_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "cheese_ball_melting",
    displayNameVi: "Vi\xEAn ph\xF4 mai tan ch\u1EA3y",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4200,
    perfectWindowMs: 2500,
    overcookTimeMs: 2500,
    basePrice: 11e3,
    baseReward: 44,
    unlockTier: 5,
    spriteKey: "shape_round_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "seafood_cheese",
    displayNameVi: "H\u1EA3i s\u1EA3n s\u1ED1t ph\xF4 mai",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 9500,
    baseReward: 38,
    unlockTier: 4,
    spriteKey: "shape_round_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "seafood_mayo",
    displayNameVi: "H\u1EA3i s\u1EA3n s\u1ED1t mayo",
    category: "vien",
    shapeProfile: "round",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 9500,
    baseReward: 38,
    unlockTier: 4,
    spriteKey: "fish_ball_classic",
    servingStyle: "skewer",
    sauceTags: ["mayo", "tuong_ot"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  // B. Cá/chả/đậu hũ (19-28)
  {
    id: "fish_tofu",
    displayNameVi: "\u0110\u1EADu h\u0169 c\xE1",
    category: "tofu_cake",
    shapeProfile: "cube",
    cookTimeMs: 4e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 6e3,
    baseReward: 25,
    unlockTier: 1,
    spriteKey: "fish_tofu",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "cheese_tofu",
    displayNameVi: "\u0110\u1EADu h\u0169 ph\xF4 mai",
    category: "tofu_cake",
    shapeProfile: "cube",
    cookTimeMs: 4200,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 7500,
    baseReward: 30,
    unlockTier: 2,
    spriteKey: "shape_cube_cheese",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "fish_cake",
    displayNameVi: "Ch\u1EA3 c\xE1",
    category: "tofu_cake",
    shapeProfile: "flat",
    cookTimeMs: 3800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 5e3,
    baseReward: 20,
    unlockTier: 1,
    spriteKey: "shape_flat_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "fish_cake_long_bean",
    displayNameVi: "Ch\u1EA3 c\xE1 \u0111\u1EADu \u0111\u0169a",
    category: "tofu_cake",
    shapeProfile: "cylinder",
    cookTimeMs: 4200,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 6500,
    baseReward: 26,
    unlockTier: 2,
    spriteKey: "shape_cylinder_green",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fish_cake_chili",
    displayNameVi: "Ch\u1EA3 c\xE1 b\u1ECDc \u1EDBt",
    category: "tofu_cake",
    shapeProfile: "cylinder",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 8500,
    baseReward: 34,
    unlockTier: 4,
    spriteKey: "shape_cylinder_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fish_cake_quail_egg",
    displayNameVi: "Ch\u1EA3 c\xE1 b\u1ECDc tr\u1EE9ng c\xFAt",
    category: "tofu_cake",
    shapeProfile: "round",
    cookTimeMs: 5e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 9e3,
    baseReward: 36,
    unlockTier: 4,
    spriteKey: "shape_round_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fish_cake_corn_veg",
    displayNameVi: "Ch\u1EA3 c\xE1 s\u1EEFa b\u1EAFp rau c\u1EE7",
    category: "tofu_cake",
    shapeProfile: "flat",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 8500,
    baseReward: 34,
    unlockTier: 5,
    spriteKey: "shape_flat_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "crab_roll",
    displayNameVi: "Ch\u1EA3 cua cu\u1ED1n",
    category: "tofu_cake",
    shapeProfile: "cylinder",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 9500,
    baseReward: 38,
    unlockTier: 5,
    spriteKey: "shape_cylinder_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "seafood_stuffed_snail",
    displayNameVi: "\u1ED0c nh\u1ED3i h\u1EA3i s\u1EA3n",
    category: "tofu_cake",
    shapeProfile: "specialty",
    cookTimeMs: 5500,
    perfectWindowMs: 3200,
    overcookTimeMs: 3e3,
    basePrice: 11e3,
    baseReward: 44,
    unlockTier: 5,
    spriteKey: "shape_specialty_snail",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "nuoc_mam"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "basa_stuffed_snail",
    displayNameVi: "\u1ED0c nh\u1ED3i basa",
    category: "tofu_cake",
    shapeProfile: "specialty",
    cookTimeMs: 5500,
    perfectWindowMs: 3200,
    overcookTimeMs: 3e3,
    basePrice: 10500,
    baseReward: 42,
    unlockTier: 5,
    spriteKey: "shape_specialty_snail",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "nuoc_mam"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  // C. Xúc xích / hồ lô / meat snacks (29-38)
  {
    id: "sausage_red",
    displayNameVi: "X\xFAc x\xEDch \u0111\u1ECF",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 5500,
    perfectWindowMs: 3500,
    overcookTimeMs: 3e3,
    basePrice: 8e3,
    baseReward: 30,
    unlockTier: 1,
    spriteKey: "sausage_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "sausage_smoked",
    displayNameVi: "X\xFAc x\xEDch x\xF4ng kh\xF3i",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 5800,
    perfectWindowMs: 3500,
    overcookTimeMs: 3e3,
    basePrice: 9e3,
    baseReward: 36,
    unlockTier: 2,
    spriteKey: "shape_cylinder_brown",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "sausage_german",
    displayNameVi: "X\xFAc x\xEDch \u0110\u1EE9c",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 6e3,
    perfectWindowMs: 3500,
    overcookTimeMs: 3e3,
    basePrice: 11e3,
    baseReward: 44,
    unlockTier: 3,
    spriteKey: "shape_cylinder_brown",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "sausage_french",
    displayNameVi: "X\xFAc x\xEDch Ph\xE1p",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 6200,
    perfectWindowMs: 3500,
    overcookTimeMs: 3e3,
    basePrice: 13e3,
    baseReward: 52,
    unlockTier: 5,
    spriteKey: "shape_cylinder_brown",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "sausage_cheese",
    displayNameVi: "X\xFAc x\xEDch ph\xF4 mai",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 5500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 10500,
    baseReward: 42,
    unlockTier: 3,
    spriteKey: "sausage_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "sausage_spiral",
    displayNameVi: "X\xFAc x\xEDch l\u1ED1c xo\xE1y",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 5e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 12e3,
    baseReward: 48,
    unlockTier: 5,
    spriteKey: "sausage_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "ho_lo",
    displayNameVi: "H\u1ED3 l\xF4",
    category: "sausage",
    shapeProfile: "round",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 7e3,
    baseReward: 28,
    unlockTier: 1,
    spriteKey: "shape_round_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "ho_lo_thai",
    displayNameVi: "H\u1ED3 l\xF4 Th\xE1i",
    category: "sausage",
    shapeProfile: "round",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 8500,
    baseReward: 34,
    unlockTier: 5,
    spriteKey: "shape_round_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "sa_te"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "pork_cartilage_sausage",
    displayNameVi: "D\u1ED3i s\u1EE5n",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 5800,
    perfectWindowMs: 3200,
    overcookTimeMs: 3e3,
    basePrice: 1e4,
    baseReward: 40,
    unlockTier: 5,
    spriteKey: "shape_cylinder_brown",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "nuoc_mam"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "beef_lolot",
    displayNameVi: "B\xF2 cu\u1ED9n l\xE1 l\u1ED1t",
    category: "sausage",
    shapeProfile: "cylinder",
    cookTimeMs: 5200,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 11500,
    baseReward: 46,
    unlockTier: 5,
    spriteKey: "shape_cylinder_green",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "nuoc_mam"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  // D. Surimi / seafood shapes (39-46)
  {
    id: "crab_stick",
    displayNameVi: "Thanh cua",
    category: "surimi",
    shapeProfile: "cylinder",
    cookTimeMs: 4e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2500,
    basePrice: 7e3,
    baseReward: 28,
    unlockTier: 2,
    spriteKey: "shape_cylinder_red",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "shrimp_surimi",
    displayNameVi: "T\xF4m surimi",
    category: "surimi",
    shapeProfile: "specialty",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 8500,
    baseReward: 34,
    unlockTier: 3,
    spriteKey: "shape_round_orange",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "squid_twist",
    displayNameVi: "M\u1EF1c xo\u1EAFn",
    category: "surimi",
    shapeProfile: "specialty",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 8500,
    baseReward: 34,
    unlockTier: 3,
    spriteKey: "shape_specialty_twist",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "shrimp_twist",
    displayNameVi: "T\xF4m xo\u1EAFn",
    category: "surimi",
    shapeProfile: "specialty",
    cookTimeMs: 4600,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 9e3,
    baseReward: 36,
    unlockTier: 4,
    spriteKey: "shape_specialty_twist",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "scallop_surimi",
    displayNameVi: "S\xF2 \u0111i\u1EC7p surimi",
    category: "surimi",
    shapeProfile: "round",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 9500,
    baseReward: 38,
    unlockTier: 4,
    spriteKey: "shape_round_golden",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "seafood_bag",
    displayNameVi: "T\xFAi ti\u1EC1n h\u1EA3i s\u1EA3n",
    category: "surimi",
    shapeProfile: "specialty",
    cookTimeMs: 5200,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 11e3,
    baseReward: 44,
    unlockTier: 5,
    spriteKey: "shape_specialty_bag",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "seafood_bread",
    displayNameVi: "B\xE1nh m\xEC h\u1EA3i s\u1EA3n",
    category: "surimi",
    shapeProfile: "flat",
    cookTimeMs: 4200,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 1e4,
    baseReward: 40,
    unlockTier: 5,
    spriteKey: "shape_flat_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "salmon_sandwich",
    displayNameVi: "C\xE1 h\u1ED3i sandwich",
    category: "surimi",
    shapeProfile: "flat",
    cookTimeMs: 4500,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 12500,
    baseReward: 50,
    unlockTier: 5,
    spriteKey: "shape_flat_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  // E. Dumpling / wrapped snacks (47-54)
  {
    id: "ha_cao",
    displayNameVi: "H\xE1 c\u1EA3o",
    category: "dumpling",
    shapeProfile: "dumpling",
    cookTimeMs: 4200,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 6e3,
    baseReward: 25,
    unlockTier: 1,
    spriteKey: "shape_dumpling_white",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "fried_wonton",
    displayNameVi: "Ho\xE0nh th\xE1nh chi\xEAn",
    category: "dumpling",
    shapeProfile: "dumpling",
    cookTimeMs: 3800,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 7e3,
    baseReward: 28,
    unlockTier: 2,
    spriteKey: "shape_dumpling_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "shrimp_dumpling",
    displayNameVi: "S\u1EE7i c\u1EA3o t\xF4m",
    category: "dumpling",
    shapeProfile: "dumpling",
    cookTimeMs: 4600,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 1e4,
    baseReward: 40,
    unlockTier: 5,
    spriteKey: "shape_dumpling_white",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "xiu_mai",
    displayNameVi: "X\xEDu m\u1EA1i",
    category: "dumpling",
    shapeProfile: "round",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 3e3,
    basePrice: 7500,
    baseReward: 30,
    unlockTier: 2,
    spriteKey: "shape_round_orange",
    servingStyle: "skewer",
    sauceTags: ["tuong_ot", "tuong_den"],
    quantityPerOrderRange: [1, 3],
    enabled: true
  },
  {
    id: "mini_fried_bao",
    displayNameVi: "B\xE1nh bao chi\xEAn",
    category: "dumpling",
    shapeProfile: "round",
    cookTimeMs: 4500,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 8500,
    baseReward: 34,
    unlockTier: 4,
    spriteKey: "shape_round_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fish_roe_bao",
    displayNameVi: "B\xE1nh bao tr\u1EE9ng c\xE1",
    category: "dumpling",
    shapeProfile: "round",
    cookTimeMs: 4800,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 9500,
    baseReward: 38,
    unlockTier: 4,
    spriteKey: "shape_round_orange",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "spring_roll_meat",
    displayNameVi: "Ch\u1EA3 gi\xF2 nh\xE2n th\u1ECBt",
    category: "dumpling",
    shapeProfile: "cylinder",
    cookTimeMs: 5e3,
    perfectWindowMs: 3e3,
    overcookTimeMs: 2800,
    basePrice: 9500,
    baseReward: 38,
    unlockTier: 5,
    spriteKey: "shape_cylinder_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "nuoc_mam"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "cha_ram",
    displayNameVi: "Ch\u1EA3 ram",
    category: "dumpling",
    shapeProfile: "cylinder",
    cookTimeMs: 4500,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 9e3,
    baseReward: 36,
    unlockTier: 5,
    spriteKey: "shape_cylinder_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "nuoc_mam"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  // F. Cheese / crispy snack extensions (55-60)
  {
    id: "cheese_stick",
    displayNameVi: "Ph\xF4 mai que",
    category: "cheese_crispy",
    shapeProfile: "cylinder",
    cookTimeMs: 3800,
    perfectWindowMs: 2500,
    overcookTimeMs: 2200,
    basePrice: 9e3,
    baseReward: 36,
    unlockTier: 3,
    spriteKey: "shape_cylinder_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "green_rice_cheese_stick",
    displayNameVi: "Ph\xF4 mai que c\u1ED1m",
    category: "cheese_crispy",
    shapeProfile: "cylinder",
    cookTimeMs: 4e3,
    perfectWindowMs: 2500,
    overcookTimeMs: 2200,
    basePrice: 10500,
    baseReward: 42,
    unlockTier: 5,
    spriteKey: "shape_cylinder_green",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fresh_milk_cake",
    displayNameVi: "B\xE1nh s\u1EEFa t\u01B0\u01A1i chi\xEAn",
    category: "cheese_crispy",
    shapeProfile: "cube",
    cookTimeMs: 3600,
    perfectWindowMs: 2500,
    overcookTimeMs: 2200,
    basePrice: 8500,
    baseReward: 34,
    unlockTier: 5,
    spriteKey: "shape_cube_cheese",
    servingStyle: "tray",
    sauceTags: ["mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "fried_sour_sausage",
    displayNameVi: "Nem chua r\xE1n",
    category: "cheese_crispy",
    shapeProfile: "cylinder",
    cookTimeMs: 4500,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 1e4,
    baseReward: 40,
    unlockTier: 5,
    spriteKey: "shape_cylinder_red",
    servingStyle: "tray",
    sauceTags: ["tuong_ot"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "chicken_cheese_cake",
    displayNameVi: "B\xE1nh g\xE0 ph\xF4 mai",
    category: "cheese_crispy",
    shapeProfile: "flat",
    cookTimeMs: 4800,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 12e3,
    baseReward: 48,
    unlockTier: 5,
    spriteKey: "shape_flat_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  },
  {
    id: "french_fries",
    displayNameVi: "Khoai t\xE2y chi\xEAn",
    category: "cheese_crispy",
    shapeProfile: "specialty",
    cookTimeMs: 3800,
    perfectWindowMs: 2800,
    overcookTimeMs: 2500,
    basePrice: 8e3,
    baseReward: 32,
    unlockTier: 5,
    spriteKey: "shape_cylinder_golden",
    servingStyle: "tray",
    sauceTags: ["tuong_ot", "mayo"],
    quantityPerOrderRange: [1, 2],
    enabled: true
  }
];
var FOOD_CATALOG_MAP = Object.fromEntries(
  FULL_FOOD_CATALOG.map((item) => [item.id, item])
);
function getFoodConfig(foodId) {
  return FOOD_CATALOG_MAP[foodId];
}
function getUnlockCost(food) {
  return food.basePrice * 4;
}

// src/db/repository.ts
var DEFAULT_UPGRADES = {
  pan_capacity: 1,
  oil_thermostat: 1,
  awning_comfort: 1,
  speed_tongs: 1,
  tray_expansion: 1
};
function evaluateOrderServerSide(order, servedItems, appliedSauces = [], hasDuaChua = false) {
  let totalCoins = 0;
  let totalXp = 0;
  let perfectCount = 0;
  let acceptableCount = 0;
  let undercookedCount = 0;
  let overcookedCount = 0;
  const remainingServed = [...servedItems];
  const matchedIndices = [];
  for (const orderItem of order.items) {
    const config2 = getFoodConfig(orderItem.foodId);
    const basePrice = config2?.basePrice ?? 5e3;
    const baseReward = config2?.baseReward ?? 20;
    let fulfilled = 0;
    for (let i = 0; i < remainingServed.length; i++) {
      if (matchedIndices.includes(i)) continue;
      const item = remainingServed[i];
      if (item.foodId === orderItem.foodId) {
        matchedIndices.push(i);
        fulfilled++;
        if (item.state === "perfect") {
          perfectCount++;
          totalCoins += Math.round(basePrice * 1.3);
          totalXp += Math.round(baseReward * 1.5);
        } else if (item.state === "cooking") {
          acceptableCount++;
          totalCoins += basePrice;
          totalXp += baseReward;
        } else if (item.state === "raw") {
          undercookedCount++;
        } else if (item.state === "overcooked") {
          overcookedCount++;
        }
        if (fulfilled >= orderItem.quantity) break;
      }
    }
  }
  const totalCount = matchedIndices.length || 1;
  const perfectRatio = perfectCount / totalCount;
  let cookScore = Math.round(perfectRatio * 50);
  if (undercookedCount > 0) cookScore = Math.max(0, cookScore - 25);
  if (overcookedCount > 0) cookScore = Math.max(0, cookScore - 30);
  let sauceScore = 20;
  if (order.requestedSauces.length > 0) {
    let matchedSauces = 0;
    for (const sauce of order.requestedSauces) {
      if (appliedSauces.includes(sauce)) matchedSauces++;
    }
    const sauceRatio = matchedSauces / order.requestedSauces.length;
    sauceScore = Math.round(sauceRatio * 30);
  }
  if (order.hasDuaChua) {
    if (hasDuaChua) {
      sauceScore = Math.min(30, sauceScore + 5);
    } else {
      sauceScore = Math.max(0, sauceScore - 10);
    }
  }
  const elapsed = Date.now() - order.createdAt;
  const remainingRatio = Math.max(0, 1 - elapsed / order.patienceMs);
  const speedScore = Math.round(remainingRatio * 20);
  const satisfactionScore = Math.max(0, Math.min(100, cookScore + sauceScore + speedScore));
  if (satisfactionScore >= 80) {
    totalCoins = Math.round(totalCoins * 1.25);
  }
  return {
    coinsEarned: totalCoins,
    xpEarned: totalXp,
    satisfactionScore,
    perfectCount,
    acceptableCount,
    undercookedCount,
    overcookedCount
  };
}
var MemoryStore = class {
  players = /* @__PURE__ */ new Map();
  sessions = /* @__PURE__ */ new Map();
  progress = /* @__PURE__ */ new Map();
  unlocks = /* @__PURE__ */ new Map();
  // playerId -> foodId[]
  upgrades = /* @__PURE__ */ new Map();
  // playerId -> (upgradeKey -> tier)
  stats = /* @__PURE__ */ new Map();
  achievements = /* @__PURE__ */ new Map();
  activeOrders = /* @__PURE__ */ new Map();
  orderRuns = /* @__PURE__ */ new Map();
  /**
   * Runs a state mutation synchronously inside an atomic transaction snapshot.
   * If any exception is thrown, state is cleanly rolled back to its pre-transaction state.
   */
  runInTransaction(action) {
    const playersSnap = new Map(this.players);
    const sessionsSnap = new Map(this.sessions);
    const progressSnap = new Map(Array.from(this.progress.entries()).map(([k, v]) => [k, { ...v }]));
    const unlocksSnap = new Map(Array.from(this.unlocks.entries()).map(([k, v]) => [k, [...v]]));
    const upgradesSnap = new Map(
      Array.from(this.upgrades.entries()).map(([k, v]) => [k, new Map(v)])
    );
    const statsSnap = new Map(Array.from(this.stats.entries()).map(([k, v]) => [k, { ...v }]));
    const achSnap = new Map(
      Array.from(this.achievements.entries()).map(([k, v]) => [k, v.map((item) => ({ ...item }))])
    );
    const ordersSnap = new Map(this.activeOrders);
    const runsSnap = new Map(this.orderRuns);
    try {
      return action();
    } catch (err) {
      this.players = playersSnap;
      this.sessions = sessionsSnap;
      this.progress = progressSnap;
      this.unlocks = unlocksSnap;
      this.upgrades = upgradesSnap;
      this.stats = statsSnap;
      this.achievements = achSnap;
      this.activeOrders = ordersSnap;
      this.orderRuns = runsSnap;
      throw err;
    }
  }
  reset() {
    this.players.clear();
    this.sessions.clear();
    this.progress.clear();
    this.unlocks.clear();
    this.upgrades.clear();
    this.stats.clear();
    this.achievements.clear();
    this.activeOrders.clear();
    this.orderRuns.clear();
  }
};
var memStore = new MemoryStore();
var PlayerRepository = class {
  /**
   * Generates a new guest player with initial progress and starter food unlocks.
   */
  static async createGuestPlayer() {
    const db = getDb();
    const playerId = crypto.randomUUID();
    const sessionToken = `sess_${crypto.randomBytes(24).toString("hex")}`;
    const displayName = `Kh\xE1ch #${Math.floor(1e3 + Math.random() * 9e3)}`;
    const starterFoods = ["fish_ball_classic", "beef_ball_classic", "sausage_red", "fish_tofu"];
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
    if (db) {
      await db.insert(players).values({
        id: playerId,
        displayName,
        isGuest: true
      });
      await db.insert(playerSessions).values({
        id: crypto.randomUUID(),
        playerId,
        sessionToken,
        expiresAt
      });
      await db.insert(playerProgress).values({
        id: crypto.randomUUID(),
        playerId,
        coins: 1e4,
        level: 1,
        xp: 0,
        reputation: 100
      });
      for (const foodId of starterFoods) {
        await db.insert(playerFoodUnlocks).values({
          id: crypto.randomUUID(),
          playerId,
          foodId
        });
      }
      for (const [key, tier] of Object.entries(DEFAULT_UPGRADES)) {
        await db.insert(playerUpgrades).values({
          id: crypto.randomUUID(),
          playerId,
          upgradeKey: key,
          tier
        });
      }
      await db.insert(playerStats).values({
        id: crypto.randomUUID(),
        playerId,
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0
      });
    } else {
      memStore.players.set(playerId, { id: playerId, displayName, isGuest: true });
      memStore.sessions.set(sessionToken, {
        id: crypto.randomUUID(),
        playerId,
        sessionToken,
        expiresAt
      });
      memStore.progress.set(playerId, {
        id: crypto.randomUUID(),
        playerId,
        coins: 1e4,
        level: 1,
        xp: 0,
        reputation: 100
      });
      memStore.unlocks.set(playerId, [...starterFoods]);
      const initialUpgrades = /* @__PURE__ */ new Map();
      for (const [k, v] of Object.entries(DEFAULT_UPGRADES)) {
        initialUpgrades.set(k, v);
      }
      memStore.upgrades.set(playerId, initialUpgrades);
      memStore.stats.set(playerId, {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0
      });
      memStore.achievements.set(playerId, []);
    }
    return this.getPlayerBySession(sessionToken);
  }
  /**
   * Retrieves full player state by session token.
   */
  static async getPlayerBySession(sessionToken) {
    const db = getDb();
    if (db) {
      const sessionResult = await db.select().from(playerSessions).where(eq(playerSessions.sessionToken, sessionToken)).limit(1);
      if (sessionResult.length === 0) return null;
      const session = sessionResult[0];
      if (/* @__PURE__ */ new Date() > new Date(session.expiresAt)) return null;
      const playerResult = await db.select().from(players).where(eq(players.id, session.playerId)).limit(1);
      if (playerResult.length === 0) return null;
      const player = playerResult[0];
      const progressResult = await db.select().from(playerProgress).where(eq(playerProgress.playerId, player.id)).limit(1);
      const progress = progressResult[0] || { coins: 0, level: 1, xp: 0, reputation: 100 };
      const unlocksResult = await db.select().from(playerFoodUnlocks).where(eq(playerFoodUnlocks.playerId, player.id));
      const unlockedFoods = unlocksResult.map((u) => u.foodId);
      const upgradesResult = await db.select().from(playerUpgrades).where(eq(playerUpgrades.playerId, player.id));
      const upgrades = { ...DEFAULT_UPGRADES };
      for (const u of upgradesResult) {
        upgrades[u.upgradeKey] = u.tier;
      }
      const statsResult = await db.select().from(playerStats).where(eq(playerStats.playerId, player.id)).limit(1);
      const st = statsResult[0] || {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0
      };
      let upgradesPurchased = 0;
      for (const [k, v] of Object.entries(upgrades)) {
        const def = DEFAULT_UPGRADES[k] ?? 1;
        if (v > def) upgradesPurchased += v - def;
      }
      const achievementsResult = await db.select().from(playerAchievements).where(eq(playerAchievements.playerId, player.id));
      const unlockedAchievements = achievementsResult.map((a) => a.achievementId);
      const claimedAchievements = achievementsResult.filter((a) => a.claimed).map((a) => a.achievementId);
      return {
        player: {
          id: player.id,
          displayName: player.displayName,
          isGuest: player.isGuest
        },
        progress: {
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          reputation: progress.reputation
        },
        unlockedFoods,
        sessionToken,
        upgrades,
        stats: {
          ordersServed: st.ordersServed,
          perfectItemsFried: st.perfectItemsFried,
          totalCoinsEarned: st.totalCoinsEarned,
          foodsUnlockedCount: unlockedFoods.length,
          upgradesPurchasedCount: upgradesPurchased
        },
        unlockedAchievements,
        claimedAchievements
      };
    } else {
      const session = memStore.sessions.get(sessionToken);
      if (!session || /* @__PURE__ */ new Date() > session.expiresAt) return null;
      const player = memStore.players.get(session.playerId);
      if (!player) return null;
      const progress = memStore.progress.get(player.id) || {
        id: "mock",
        playerId: player.id,
        coins: 0,
        level: 1,
        xp: 0,
        reputation: 100
      };
      const unlocks = memStore.unlocks.get(player.id) || [];
      const upgMap = memStore.upgrades.get(player.id) || /* @__PURE__ */ new Map();
      const upgrades = { ...DEFAULT_UPGRADES };
      for (const [k, v] of upgMap.entries()) {
        upgrades[k] = v;
      }
      let upgradesPurchased = 0;
      for (const [k, v] of Object.entries(upgrades)) {
        const def = DEFAULT_UPGRADES[k] ?? 1;
        if (v > def) upgradesPurchased += v - def;
      }
      const st = memStore.stats.get(player.id) || {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0
      };
      const achList = memStore.achievements.get(player.id) || [];
      const unlockedAchievements = achList.map((a) => a.id);
      const claimedAchievements = achList.filter((a) => a.claimed).map((a) => a.id);
      return {
        player: {
          id: player.id,
          displayName: player.displayName,
          isGuest: player.isGuest
        },
        progress: {
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          reputation: progress.reputation
        },
        unlockedFoods: [...unlocks],
        sessionToken,
        upgrades,
        stats: {
          ordersServed: st.ordersServed,
          perfectItemsFried: st.perfectItemsFried,
          totalCoinsEarned: st.totalCoinsEarned,
          foodsUnlockedCount: unlocks.length,
          upgradesPurchasedCount: upgradesPurchased
        },
        unlockedAchievements,
        claimedAchievements
      };
    }
  }
  /**
   * Creates a server-authoritative active order for the player.
   * Validates that all items are among the player's unlocked foods.
   */
  static async createActiveOrder(playerId, preferredItems) {
    const db = getDb();
    let unlockedFoodIds = [];
    if (db) {
      const rows = await db.select().from(playerFoodUnlocks).where(eq(playerFoodUnlocks.playerId, playerId));
      unlockedFoodIds = rows.map((r) => r.foodId);
    } else {
      unlockedFoodIds = memStore.unlocks.get(playerId) || [
        "fish_ball_classic",
        "beef_ball_classic",
        "sausage_red",
        "fish_tofu"
      ];
    }
    if (unlockedFoodIds.length === 0) {
      unlockedFoodIds = ["fish_ball_classic", "beef_ball_classic", "sausage_red", "fish_tofu"];
    }
    let items = [];
    if (preferredItems && preferredItems.length > 0) {
      for (const it of preferredItems) {
        if (!unlockedFoodIds.includes(it.foodId)) {
          throw new Error(`FOOD_NOT_UNLOCKED: ${it.foodId}`);
        }
      }
      items = preferredItems;
    } else {
      const pool = FULL_FOOD_CATALOG.filter((f) => unlockedFoodIds.includes(f.id));
      const count = Math.min(pool.length, Math.random() < 0.6 ? 1 : 2);
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      items = selected.map((f) => ({
        foodId: f.id,
        quantity: Math.floor(
          Math.random() * (f.quantityPerOrderRange[1] - f.quantityPerOrderRange[0] + 1)
        ) + f.quantityPerOrderRange[0]
      }));
    }
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const requestedSauces = ["tuong_ot"];
    const hasDuaChua = Math.random() < 0.5;
    const patienceMs = 6e4;
    const activeOrderObj = {
      id: orderId,
      playerId,
      items,
      requestedSauces,
      hasDuaChua,
      status: "active",
      createdAt: Date.now(),
      patienceMs
    };
    if (db) {
      await db.insert(activeOrders).values({
        id: orderId,
        playerId,
        itemsJson: JSON.stringify(items),
        requestedSaucesJson: JSON.stringify(requestedSauces),
        hasDuaChua,
        status: "active",
        createdAt: new Date(activeOrderObj.createdAt),
        patienceMs
      });
    } else {
      memStore.activeOrders.set(orderId, {
        id: orderId,
        playerId,
        itemsJson: JSON.stringify(items),
        requestedSaucesJson: JSON.stringify(requestedSauces),
        hasDuaChua,
        status: "active",
        createdAt: new Date(activeOrderObj.createdAt),
        patienceMs
      });
    }
    return activeOrderObj;
  }
  /**
   * Retrieves an active order by orderId.
   */
  static async getActiveOrder(orderId) {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(activeOrders).where(eq(activeOrders.id, orderId)).limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        id: row.id,
        playerId: row.playerId,
        items: JSON.parse(row.itemsJson),
        requestedSauces: JSON.parse(row.requestedSaucesJson),
        hasDuaChua: row.hasDuaChua,
        status: row.status,
        createdAt: new Date(row.createdAt).getTime(),
        patienceMs: row.patienceMs
      };
    } else {
      const row = memStore.activeOrders.get(orderId);
      if (!row) return null;
      return {
        id: row.id,
        playerId: row.playerId,
        items: JSON.parse(row.itemsJson),
        requestedSauces: JSON.parse(row.requestedSaucesJson),
        hasDuaChua: row.hasDuaChua,
        status: row.status,
        createdAt: new Date(row.createdAt).getTime(),
        patienceMs: row.patienceMs
      };
    }
  }
  /**
   * Complete order with server-authoritative reward derivation and idempotency protection.
   * Validates active order, cross-player access, unlocked foods, and derives rewards server-side.
   */
  static async completeOrderWithIdempotency(playerId, orderId, idempotencyKey, servedItems, appliedSauces = [], hasDuaChua = false) {
    const db = getDb();
    if (db) {
      const existingRun = await db.select().from(orderRuns).where(eq(orderRuns.idempotencyKey, idempotencyKey)).limit(1);
      if (existingRun.length > 0) {
        const run = existingRun[0];
        const currentProgress = (await db.select().from(playerProgress).where(eq(playerProgress.playerId, playerId)).limit(1))[0];
        const st = (await db.select().from(playerStats).where(eq(playerStats.playerId, playerId)).limit(1))[0] || { ordersServed: 0, perfectItemsFried: 0, totalCoinsEarned: 0 };
        const unlocksCount = (await db.select().from(playerFoodUnlocks).where(eq(playerFoodUnlocks.playerId, playerId))).length;
        return {
          wasIdempotent: true,
          coinsAwarded: run.coinsAwarded,
          xpAwarded: run.xpAwarded,
          newTotalCoins: currentProgress?.coins ?? 0,
          newLevel: currentProgress?.level ?? 1,
          newXp: currentProgress?.xp ?? 0,
          stats: {
            ordersServed: st.ordersServed,
            perfectItemsFried: st.perfectItemsFried,
            totalCoinsEarned: st.totalCoinsEarned,
            foodsUnlockedCount: unlocksCount,
            upgradesPurchasedCount: 0
          },
          newlyUnlockedAchievements: []
        };
      }
    } else {
      if (memStore.orderRuns.has(idempotencyKey)) {
        const existing = memStore.orderRuns.get(idempotencyKey);
        const prog = memStore.progress.get(playerId);
        const st = memStore.stats.get(playerId) || {
          ordersServed: 0,
          perfectItemsFried: 0,
          totalCoinsEarned: 0
        };
        const unlocks = memStore.unlocks.get(playerId) || [];
        return {
          wasIdempotent: true,
          coinsAwarded: existing.coinsAwarded,
          xpAwarded: existing.xpAwarded,
          newTotalCoins: prog.coins,
          newLevel: prog.level,
          newXp: prog.xp,
          stats: {
            ...st,
            foodsUnlockedCount: unlocks.length,
            upgradesPurchasedCount: 0
          },
          newlyUnlockedAchievements: []
        };
      }
    }
    const order = await this.getActiveOrder(orderId);
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }
    if (order.playerId !== playerId) {
      throw new Error("FORBIDDEN_NOT_YOUR_ORDER");
    }
    if (order.status === "completed") {
      throw new Error("ORDER_ALREADY_COMPLETED");
    }
    let unlockedFoodIds = [];
    if (db) {
      const rows = await db.select().from(playerFoodUnlocks).where(eq(playerFoodUnlocks.playerId, playerId));
      unlockedFoodIds = rows.map((r) => r.foodId);
    } else {
      unlockedFoodIds = memStore.unlocks.get(playerId) || [];
    }
    for (const item of servedItems) {
      const config2 = getFoodConfig(item.foodId);
      if (!config2) {
        throw new Error(`INVALID_FOOD_ID: ${item.foodId}`);
      }
      if (!unlockedFoodIds.includes(item.foodId)) {
        throw new Error(`FOOD_NOT_UNLOCKED: ${item.foodId}`);
      }
    }
    const evalResult = evaluateOrderServerSide(order, servedItems, appliedSauces, hasDuaChua);
    const coinsAwarded = evalResult.coinsEarned;
    const xpAwarded = evalResult.xpEarned;
    const perfectCount = evalResult.perfectCount;
    if (db) {
      await db.update(activeOrders).set({ status: "completed" }).where(eq(activeOrders.id, orderId));
      await db.insert(orderRuns).values({
        id: crypto.randomUUID(),
        playerId,
        idempotencyKey,
        status: "completed",
        itemsJson: JSON.stringify(servedItems),
        coinsAwarded,
        xpAwarded
      });
      const progRes = await db.update(playerProgress).set({
        coins: sql`${playerProgress.coins} + ${coinsAwarded}`,
        xp: sql`${playerProgress.xp} + ${xpAwarded}`,
        level: sql`1 + floor((${playerProgress.xp} + ${xpAwarded}) / 100)`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(playerProgress.playerId, playerId)).returning({
        coins: playerProgress.coins,
        xp: playerProgress.xp,
        level: playerProgress.level
      });
      const newProg = progRes[0] || { coins: coinsAwarded, xp: xpAwarded, level: 1 };
      await db.update(playerStats).set({
        ordersServed: sql`${playerStats.ordersServed} + 1`,
        perfectItemsFried: sql`${playerStats.perfectItemsFried} + ${perfectCount}`,
        totalCoinsEarned: sql`${playerStats.totalCoinsEarned} + ${coinsAwarded}`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(playerStats.playerId, playerId));
      const currentStats = (await db.select().from(playerStats).where(eq(playerStats.playerId, playerId)).limit(1))[0];
      const existingAch = await db.select().from(playerAchievements).where(eq(playerAchievements.playerId, playerId));
      const unlockedAchIds = new Set(existingAch.map((a) => a.achievementId));
      const upgradesCount = (await db.select().from(playerUpgrades).where(eq(playerUpgrades.playerId, playerId))).filter((u) => u.tier > 1).length;
      const statsForCheck = {
        ordersServed: currentStats?.ordersServed ?? 1,
        perfectItemsFried: currentStats?.perfectItemsFried ?? perfectCount,
        totalCoinsEarned: currentStats?.totalCoinsEarned ?? coinsAwarded,
        foodsUnlockedCount: unlockedFoodIds.length,
        upgradesPurchasedCount: upgradesCount
      };
      const newlyUnlocked = [];
      for (const ach of ACHIEVEMENTS) {
        if (!unlockedAchIds.has(ach.id) && checkAchievementUnlocked(ach, statsForCheck, newProg.coins)) {
          unlockedAchIds.add(ach.id);
          newlyUnlocked.push(ach.id);
          try {
            await db.insert(playerAchievements).values({
              id: crypto.randomUUID(),
              playerId,
              achievementId: ach.id,
              claimed: false
            });
          } catch {
          }
        }
      }
      return {
        wasIdempotent: false,
        coinsAwarded,
        xpAwarded,
        newTotalCoins: newProg.coins,
        newLevel: newProg.level,
        newXp: newProg.xp,
        stats: statsForCheck,
        newlyUnlockedAchievements: newlyUnlocked
      };
    } else {
      const activeOrd = memStore.activeOrders.get(orderId);
      if (activeOrd) {
        activeOrd.status = "completed";
      }
      memStore.orderRuns.set(idempotencyKey, {
        id: crypto.randomUUID(),
        playerId,
        idempotencyKey,
        itemsJson: JSON.stringify(servedItems),
        coinsAwarded,
        xpAwarded
      });
      const prog = memStore.progress.get(playerId) || {
        id: "mock",
        playerId,
        coins: 0,
        level: 1,
        xp: 0,
        reputation: 100
      };
      prog.coins += coinsAwarded;
      prog.xp += xpAwarded;
      prog.level = 1 + Math.floor(prog.xp / 100);
      memStore.progress.set(playerId, prog);
      const currentStats = memStore.stats.get(playerId) || {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0
      };
      currentStats.ordersServed += 1;
      currentStats.perfectItemsFried += perfectCount;
      currentStats.totalCoinsEarned += coinsAwarded;
      memStore.stats.set(playerId, currentStats);
      const achList = memStore.achievements.get(playerId) || [];
      const unlockedIds = new Set(achList.map((a) => a.id));
      const upgMap = memStore.upgrades.get(playerId) || /* @__PURE__ */ new Map();
      let upgradesPurchased = 0;
      for (const [k, v] of upgMap.entries()) {
        const def = DEFAULT_UPGRADES[k] ?? 1;
        if (v > def) upgradesPurchased += v - def;
      }
      const statsForCheck = {
        ordersServed: currentStats.ordersServed,
        perfectItemsFried: currentStats.perfectItemsFried,
        totalCoinsEarned: currentStats.totalCoinsEarned,
        foodsUnlockedCount: unlockedFoodIds.length,
        upgradesPurchasedCount: upgradesPurchased
      };
      const newlyUnlocked = [];
      for (const ach of ACHIEVEMENTS) {
        if (!unlockedIds.has(ach.id) && checkAchievementUnlocked(ach, statsForCheck, prog.coins)) {
          unlockedIds.add(ach.id);
          newlyUnlocked.push(ach.id);
          achList.push({ id: ach.id, claimed: false });
        }
      }
      memStore.achievements.set(playerId, achList);
      return {
        wasIdempotent: false,
        coinsAwarded,
        xpAwarded,
        newTotalCoins: prog.coins,
        newLevel: prog.level,
        newXp: prog.xp,
        stats: statsForCheck,
        newlyUnlockedAchievements: newlyUnlocked
      };
    }
  }
  /**
   * Unlocks a new food item from the shop with atomic database transaction,
   * row locking, balance check, and rollback on failure.
   */
  static async unlockFood(playerId, foodId, cost) {
    const db = getDb();
    if (db) {
      return await db.transaction(async (tx) => {
        const [progress] = await tx.select().from(playerProgress).where(eq(playerProgress.playerId, playerId)).for("update");
        if (!progress) {
          throw new Error("PLAYER_NOT_FOUND");
        }
        const existing = await tx.select().from(playerFoodUnlocks).where(
          and(eq(playerFoodUnlocks.playerId, playerId), eq(playerFoodUnlocks.foodId, foodId))
        ).for("update");
        if (existing.length > 0) {
          throw new Error("ALREADY_UNLOCKED");
        }
        if (progress.coins < cost) {
          throw new Error("INSUFFICIENT_COINS");
        }
        const newCoins = progress.coins - cost;
        await tx.update(playerProgress).set({
          coins: newCoins,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(playerProgress.playerId, playerId));
        await tx.insert(playerFoodUnlocks).values({
          id: crypto.randomUUID(),
          playerId,
          foodId
        });
        const allUnlocks = await tx.select().from(playerFoodUnlocks).where(eq(playerFoodUnlocks.playerId, playerId));
        return {
          success: true,
          newCoins,
          unlockedFoods: allUnlocks.map((r) => r.foodId)
        };
      });
    } else {
      return memStore.runInTransaction(() => {
        const unlocked = memStore.unlocks.get(playerId) || [];
        if (unlocked.includes(foodId)) {
          throw new Error("ALREADY_UNLOCKED");
        }
        const prog = memStore.progress.get(playerId);
        if (!prog) {
          throw new Error("PLAYER_NOT_FOUND");
        }
        if (prog.coins < cost) {
          throw new Error("INSUFFICIENT_COINS");
        }
        prog.coins -= cost;
        unlocked.push(foodId);
        memStore.unlocks.set(playerId, unlocked);
        return {
          success: true,
          newCoins: prog.coins,
          unlockedFoods: [...unlocked]
        };
      });
    }
  }
  /**
   * Purchases a cart upgrade with atomic database transaction,
   * row locking, tier and level validation, and rollback on failure.
   */
  static async purchaseUpgrade(playerId, upgradeKey) {
    const upgradeConfig = getUpgradeConfig(upgradeKey);
    if (!upgradeConfig) throw new Error("INVALID_UPGRADE_KEY");
    const db = getDb();
    if (db) {
      return await db.transaction(async (tx) => {
        const [progress] = await tx.select().from(playerProgress).where(eq(playerProgress.playerId, playerId)).for("update");
        if (!progress) throw new Error("PLAYER_NOT_FOUND");
        const existing = await tx.select().from(playerUpgrades).where(
          and(eq(playerUpgrades.playerId, playerId), eq(playerUpgrades.upgradeKey, upgradeKey))
        ).for("update");
        const currentTier = existing[0]?.tier ?? DEFAULT_UPGRADES[upgradeKey] ?? 1;
        const nextTierConfig = getNextUpgradeTier(upgradeKey, currentTier);
        if (!nextTierConfig) {
          throw new Error("ALREADY_MAX_TIER");
        }
        if (progress.level < nextTierConfig.levelRequired) {
          throw new Error("LEVEL_TOO_LOW");
        }
        if (progress.coins < nextTierConfig.cost) {
          throw new Error("INSUFFICIENT_COINS");
        }
        const newCoins = progress.coins - nextTierConfig.cost;
        await tx.update(playerProgress).set({
          coins: newCoins,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(playerProgress.playerId, playerId));
        if (existing.length > 0) {
          await tx.update(playerUpgrades).set({ tier: nextTierConfig.tier, purchasedAt: /* @__PURE__ */ new Date() }).where(
            and(eq(playerUpgrades.playerId, playerId), eq(playerUpgrades.upgradeKey, upgradeKey))
          );
        } else {
          await tx.insert(playerUpgrades).values({
            id: crypto.randomUUID(),
            playerId,
            upgradeKey,
            tier: nextTierConfig.tier
          });
        }
        const allUpgrades = await tx.select().from(playerUpgrades).where(eq(playerUpgrades.playerId, playerId));
        const upgradesMap = { ...DEFAULT_UPGRADES };
        for (const u of allUpgrades) {
          upgradesMap[u.upgradeKey] = u.tier;
        }
        return {
          success: true,
          newCoins,
          upgrades: upgradesMap
        };
      });
    } else {
      return memStore.runInTransaction(() => {
        const upgMap = memStore.upgrades.get(playerId) || /* @__PURE__ */ new Map();
        const currentTier = upgMap.get(upgradeKey) ?? DEFAULT_UPGRADES[upgradeKey] ?? 1;
        const nextTierConfig = getNextUpgradeTier(upgradeKey, currentTier);
        if (!nextTierConfig) {
          throw new Error("ALREADY_MAX_TIER");
        }
        const prog = memStore.progress.get(playerId);
        if (!prog) throw new Error("PLAYER_NOT_FOUND");
        if (prog.level < nextTierConfig.levelRequired) {
          throw new Error("LEVEL_TOO_LOW");
        }
        if (prog.coins < nextTierConfig.cost) {
          throw new Error("INSUFFICIENT_COINS");
        }
        prog.coins -= nextTierConfig.cost;
        upgMap.set(upgradeKey, nextTierConfig.tier);
        memStore.upgrades.set(playerId, upgMap);
        const upgradesMap = { ...DEFAULT_UPGRADES };
        for (const [k, v] of upgMap.entries()) {
          upgradesMap[k] = v;
        }
        return {
          success: true,
          newCoins: prog.coins,
          upgrades: upgradesMap
        };
      });
    }
  }
  /**
   * Claims an achievement reward with atomic database transaction,
   * row locking, reward crediting, and rollback on failure.
   */
  static async claimAchievement(playerId, achievementId) {
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) throw new Error("ACHIEVEMENT_NOT_FOUND");
    const db = getDb();
    if (db) {
      return await db.transaction(async (tx) => {
        const existing = await tx.select().from(playerAchievements).where(
          and(
            eq(playerAchievements.playerId, playerId),
            eq(playerAchievements.achievementId, achievementId)
          )
        ).for("update");
        if (existing.length === 0) {
          throw new Error("ACHIEVEMENT_NOT_UNLOCKED");
        }
        if (existing[0].claimed) {
          throw new Error("ACHIEVEMENT_ALREADY_CLAIMED");
        }
        await tx.update(playerAchievements).set({ claimed: true }).where(eq(playerAchievements.id, existing[0].id));
        const [progress] = await tx.select().from(playerProgress).where(eq(playerProgress.playerId, playerId)).for("update");
        if (!progress) throw new Error("PLAYER_NOT_FOUND");
        const newCoins = progress.coins + ach.rewardCoins;
        const newXp = progress.xp + ach.rewardXp;
        const newLevel = 1 + Math.floor(newXp / 100);
        await tx.update(playerProgress).set({
          coins: newCoins,
          xp: newXp,
          level: newLevel,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(playerProgress.playerId, playerId));
        const allClaimed = await tx.select().from(playerAchievements).where(
          and(eq(playerAchievements.playerId, playerId), eq(playerAchievements.claimed, true))
        );
        return {
          success: true,
          newCoins,
          newXp,
          newLevel,
          claimedAchievements: allClaimed.map((a) => a.achievementId)
        };
      });
    } else {
      return memStore.runInTransaction(() => {
        const achList = memStore.achievements.get(playerId) || [];
        const target = achList.find((a) => a.id === achievementId);
        if (!target) throw new Error("ACHIEVEMENT_NOT_UNLOCKED");
        if (target.claimed) throw new Error("ACHIEVEMENT_ALREADY_CLAIMED");
        target.claimed = true;
        const prog = memStore.progress.get(playerId) || {
          id: "mock",
          playerId,
          coins: 0,
          xp: 0,
          level: 1,
          reputation: 100
        };
        prog.coins += ach.rewardCoins;
        prog.xp += ach.rewardXp;
        prog.level = 1 + Math.floor(prog.xp / 100);
        memStore.progress.set(playerId, prog);
        const claimed = achList.filter((a) => a.claimed).map((a) => a.id);
        return {
          success: true,
          newCoins: prog.coins,
          newXp: prog.xp,
          newLevel: prog.level,
          claimedAchievements: claimed
        };
      });
    }
  }
  static getMemStore() {
    return memStore;
  }
};

// api/routes/session.ts
var sessionRouter = new Hono();
var COOKIE_SESSION_NAME = "xcv_session";
function getSessionToken(c) {
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieToken = getCookie(c, COOKIE_SESSION_NAME);
  if (cookieToken) {
    return cookieToken.trim();
  }
  return null;
}
sessionRouter.post("/guest", async (c) => {
  try {
    const token = getSessionToken(c);
    if (token) {
      const existing = await PlayerRepository.getPlayerBySession(token);
      if (existing) {
        setCookie(c, COOKIE_SESSION_NAME, existing.sessionToken, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
          maxAge: 30 * 24 * 60 * 60
        });
        return c.json({
          success: true,
          data: existing
        });
      }
    }
    const newGuest = await PlayerRepository.createGuestPlayer();
    setCookie(c, COOKIE_SESSION_NAME, newGuest.sessionToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60
    });
    return c.json({
      success: true,
      data: newGuest
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session creation failed";
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_ERROR",
          message
        }
      },
      500
    );
  }
});

// api/routes/player.ts
import { Hono as Hono2 } from "hono";
var playerRouter = new Hono2();
playerRouter.get("/", async (c) => {
  const token = getSessionToken(c);
  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Phi\xEAn ch\u01A1i kh\xF4ng h\u1EE3p l\u1EC7. Vui l\xF2ng b\u1EAFt \u0111\u1EA7u l\u1EA1i."
        }
      },
      401
    );
  }
  const playerData = await PlayerRepository.getPlayerBySession(token);
  if (!playerData) {
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_EXPIRED",
          message: "Phi\xEAn ch\u01A1i \u0111\xE3 h\u1EBFt h\u1EA1n."
        }
      },
      401
    );
  }
  return c.json({
    success: true,
    data: playerData
  });
});

// api/routes/orders.ts
import { Hono as Hono3 } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
var ordersRouter = new Hono3();
var StartOrderSchema = z.object({
  preferredItems: z.array(
    z.object({
      foodId: z.string().min(1),
      quantity: z.number().int().positive()
    })
  ).optional()
});
var CompleteOrderSchema = z.object({
  orderId: z.string().min(1),
  idempotencyKey: z.string().min(8),
  servedItems: z.array(
    z.object({
      foodId: z.string(),
      state: z.enum(["raw", "cooking", "perfect", "overcooked"])
    })
  ),
  appliedSauces: z.array(z.string()).optional().default([]),
  hasDuaChua: z.boolean().optional().default(false)
});
ordersRouter.post("/start", zValidator("json", StartOrderSchema), async (c) => {
  const token = getSessionToken(c);
  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "C\u1EA7n phi\xEAn \u0111\u0103ng nh\u1EADp \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u \u0111\u01A1n h\xE0ng."
        }
      },
      401
    );
  }
  const playerState = await PlayerRepository.getPlayerBySession(token);
  if (!playerState) {
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_EXPIRED",
          message: "Phi\xEAn ch\u01A1i kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n."
        }
      },
      401
    );
  }
  const { preferredItems } = c.req.valid("json");
  try {
    const order = await PlayerRepository.createActiveOrder(playerState.player.id, preferredItems);
    return c.json({
      success: true,
      data: order
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.startsWith("FOOD_NOT_UNLOCKED")) {
      return c.json(
        {
          success: false,
          error: {
            code: "FOOD_NOT_UNLOCKED",
            message: msg
          }
        },
        403
      );
    }
    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: msg
        }
      },
      500
    );
  }
});
ordersRouter.post("/complete", zValidator("json", CompleteOrderSchema), async (c) => {
  const token = getSessionToken(c);
  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "C\u1EA7n phi\xEAn \u0111\u0103ng nh\u1EADp \u0111\u1EC3 nh\u1EADn th\u01B0\u1EDFng."
        }
      },
      401
    );
  }
  const playerState = await PlayerRepository.getPlayerBySession(token);
  if (!playerState) {
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_EXPIRED",
          message: "Phi\xEAn ch\u01A1i kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n."
        }
      },
      401
    );
  }
  const body = c.req.valid("json");
  try {
    const result = await PlayerRepository.completeOrderWithIdempotency(
      playerState.player.id,
      body.orderId,
      body.idempotencyKey,
      body.servedItems,
      body.appliedSauces,
      body.hasDuaChua
    );
    return c.json({
      success: true,
      data: result
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order completion failed";
    if (msg === "ORDER_NOT_FOUND") {
      return c.json(
        {
          success: false,
          error: {
            code: "ORDER_NOT_FOUND",
            message: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng tr\xEAn m\xE1y ch\u1EE7."
          }
        },
        404
      );
    }
    if (msg === "FORBIDDEN_NOT_YOUR_ORDER") {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "\u0110\u01A1n h\xE0ng n\xE0y kh\xF4ng thu\u1ED9c v\u1EC1 phi\xEAn c\u1EE7a b\u1EA1n."
          }
        },
        403
      );
    }
    if (msg === "ORDER_ALREADY_COMPLETED") {
      return c.json(
        {
          success: false,
          error: {
            code: "ORDER_ALREADY_COMPLETED",
            message: "\u0110\u01A1n h\xE0ng n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c ho\xE0n th\xE0nh tr\u01B0\u1EDBc \u0111\xF3."
          }
        },
        400
      );
    }
    if (msg.startsWith("FOOD_NOT_UNLOCKED")) {
      return c.json(
        {
          success: false,
          error: {
            code: "FOOD_NOT_UNLOCKED",
            message: "M\xF3n \u0103n ph\u1EE5c v\u1EE5 ch\u01B0a \u0111\u01B0\u1EE3c m\u1EDF kh\xF3a."
          }
        },
        403
      );
    }
    if (msg.startsWith("INVALID_FOOD_ID")) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_FOOD_ID",
            message: "M\xF3n \u0103n kh\xF4ng h\u1EE3p l\u1EC7."
          }
        },
        400
      );
    }
    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: msg
        }
      },
      500
    );
  }
});

// api/routes/shop.ts
import { Hono as Hono4 } from "hono";
import { zValidator as zValidator2 } from "@hono/zod-validator";
import { z as z2 } from "zod";
var shopRouter = new Hono4();
var UnlockFoodSchema = z2.object({
  foodId: z2.string().min(1)
});
shopRouter.post("/unlock", zValidator2("json", UnlockFoodSchema), async (c) => {
  const token = getSessionToken(c);
  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "C\u1EA7n phi\xEAn \u0111\u0103ng nh\u1EADp \u0111\u1EC3 m\u1EDF kh\xF3a m\xF3n."
        }
      },
      401
    );
  }
  const playerState = await PlayerRepository.getPlayerBySession(token);
  if (!playerState) {
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_EXPIRED",
          message: "Phi\xEAn ch\u01A1i kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n."
        }
      },
      401
    );
  }
  const { foodId } = c.req.valid("json");
  const food = getFoodConfig(foodId);
  if (!food) {
    return c.json(
      {
        success: false,
        error: {
          code: "FOOD_NOT_FOUND",
          message: "M\xF3n \u0103n kh\xF4ng t\u1ED3n t\u1EA1i trong th\u1EF1c \u0111\u01A1n."
        }
      },
      404
    );
  }
  const cost = getUnlockCost(food);
  try {
    const result = await PlayerRepository.unlockFood(playerState.player.id, foodId, cost);
    return c.json({
      success: true,
      data: {
        newCoins: result.newCoins,
        unlockedFoods: result.unlockedFoods,
        unlockedFood: food
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unlock failed";
    if (msg === "ALREADY_UNLOCKED") {
      return c.json(
        {
          success: false,
          error: {
            code: "ALREADY_UNLOCKED",
            message: "M\xF3n n\xE0y b\u1EA1n \u0111\xE3 m\u1EDF kh\xF3a r\u1ED3i!"
          }
        },
        400
      );
    }
    if (msg === "INSUFFICIENT_COINS") {
      return c.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_COINS",
            message: `Kh\xF4ng \u0111\u1EE7 xu \u0111\u1EC3 m\u1EDF kh\xF3a m\xF3n (C\u1EA7n ${cost.toLocaleString("vi-VN")} \u0111).`
          }
        },
        400
      );
    }
    return c.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: msg
        }
      },
      500
    );
  }
});

// api/routes/upgrades.ts
import { Hono as Hono5 } from "hono";
import { zValidator as zValidator3 } from "@hono/zod-validator";
import { z as z3 } from "zod";
var upgradesRouter = new Hono5();
var PurchaseUpgradeSchema = z3.object({
  upgradeKey: z3.string().min(1)
});
upgradesRouter.get("/catalog", (c) => {
  return c.json({
    success: true,
    data: {
      upgrades: CART_UPGRADES
    }
  });
});
upgradesRouter.post("/purchase", zValidator3("json", PurchaseUpgradeSchema), async (c) => {
  const token = getSessionToken(c);
  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "C\u1EA7n phi\xEAn \u0111\u0103ng nh\u1EADp \u0111\u1EC3 n\xE2ng c\u1EA5p xe."
        }
      },
      401
    );
  }
  const playerState = await PlayerRepository.getPlayerBySession(token);
  if (!playerState) {
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_EXPIRED",
          message: "Phi\xEAn ch\u01A1i kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n."
        }
      },
      401
    );
  }
  const { upgradeKey } = c.req.valid("json");
  const upgradeConfig = getUpgradeConfig(upgradeKey);
  if (!upgradeConfig) {
    return c.json(
      {
        success: false,
        error: {
          code: "UPGRADE_NOT_FOUND",
          message: "N\xE2ng c\u1EA5p kh\xF4ng t\u1ED3n t\u1EA1i trong danh m\u1EE5c."
        }
      },
      404
    );
  }
  const currentTier = playerState.upgrades[upgradeKey] ?? 1;
  const nextTier = getNextUpgradeTier(upgradeKey, currentTier);
  if (!nextTier) {
    return c.json(
      {
        success: false,
        error: {
          code: "ALREADY_MAX_TIER",
          message: "Trang b\u1ECB xe n\xE0y \u0111\xE3 \u0111\u1EA1t c\u1EA5p t\u1ED1i \u0111a!"
        }
      },
      400
    );
  }
  if (playerState.progress.level < nextTier.levelRequired) {
    return c.json(
      {
        success: false,
        error: {
          code: "LEVEL_TOO_LOW",
          message: `C\u1EA7n \u0111\u1EA1t C\u1EA5p ${nextTier.levelRequired} \u0111\u1EC3 m\u1EDF kh\xF3a n\xE2ng c\u1EA5p n\xE0y.`
        }
      },
      400
    );
  }
  if (playerState.progress.coins < nextTier.cost) {
    return c.json(
      {
        success: false,
        error: {
          code: "INSUFFICIENT_COINS",
          message: `Kh\xF4ng \u0111\u1EE7 xu \u0111\u1EC3 n\xE2ng c\u1EA5p (C\u1EA7n ${nextTier.cost.toLocaleString("vi-VN")} \u0111).`
        }
      },
      400
    );
  }
  try {
    const result = await PlayerRepository.purchaseUpgrade(playerState.player.id, upgradeKey);
    return c.json({
      success: true,
      data: {
        newCoins: result.newCoins,
        upgrades: result.upgrades,
        purchasedUpgrade: upgradeKey,
        newTier: nextTier.tier
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Purchase failed";
    return c.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: msg
        }
      },
      500
    );
  }
});

// api/routes/achievements.ts
import { Hono as Hono6 } from "hono";
import { zValidator as zValidator4 } from "@hono/zod-validator";
import { z as z4 } from "zod";
var achievementsRouter = new Hono6();
var ClaimAchievementSchema = z4.object({
  achievementId: z4.string().min(1)
});
achievementsRouter.get("/list", (c) => {
  return c.json({
    success: true,
    data: {
      achievements: ACHIEVEMENTS
    }
  });
});
achievementsRouter.post("/claim", zValidator4("json", ClaimAchievementSchema), async (c) => {
  const token = getSessionToken(c);
  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "C\u1EA7n phi\xEAn \u0111\u0103ng nh\u1EADp \u0111\u1EC3 nh\u1EADn th\u01B0\u1EDFng th\xE0nh t\u1EF1u."
        }
      },
      401
    );
  }
  const playerState = await PlayerRepository.getPlayerBySession(token);
  if (!playerState) {
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_EXPIRED",
          message: "Phi\xEAn ch\u01A1i kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n."
        }
      },
      401
    );
  }
  const { achievementId } = c.req.valid("json");
  try {
    const result = await PlayerRepository.claimAchievement(playerState.player.id, achievementId);
    return c.json({
      success: true,
      data: result
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claim failed";
    if (msg === "ACHIEVEMENT_NOT_UNLOCKED") {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_UNLOCKED",
            message: "Th\xE0nh t\u1EF1u n\xE0y ch\u01B0a \u0111\u01B0\u1EE3c m\u1EDF kh\xF3a!"
          }
        },
        400
      );
    }
    if (msg === "ACHIEVEMENT_ALREADY_CLAIMED") {
      return c.json(
        {
          success: false,
          error: {
            code: "ALREADY_CLAIMED",
            message: "B\u1EA1n \u0111\xE3 nh\u1EADn ph\u1EA7n th\u01B0\u1EDFng n\xE0y r\u1ED3i!"
          }
        },
        400
      );
    }
    return c.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: msg
        }
      },
      500
    );
  }
});

// api/index.ts
var config = {
  runtime: "nodejs"
};
var app = new Hono7().basePath("/api");
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "SAMEORIGIN");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "An unexpected error occurred"
      }
    },
    500
  );
});
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found"
      }
    },
    404
  );
});
var v1 = new Hono7();
app.get("/", (c) => {
  return c.json({
    success: true,
    data: {
      service: "xe-ca-vien-api",
      version: "0.1.0",
      endpoints: ["/api/v1/health", "/api/v1/game/config", "/api/v1/session/guest"]
    }
  });
});
app.get("/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      service: "xe-ca-vien-api",
      version: "0.1.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
});
v1.get("/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      service: "xe-ca-vien-api",
      version: "0.1.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
});
var GameConfigResponseSchema = z5.object({
  gameTitle: z5.string(),
  version: z5.string(),
  locale: z5.string(),
  defaultPanSlots: z5.number(),
  maxConcurrentIndex: z5.number(),
  features: z5.object({
    guestSession: z5.boolean(),
    sauceSystem: z5.boolean(),
    upgrades: z5.boolean()
  })
});
v1.get("/game/config", (c) => {
  const data = {
    gameTitle: "Xe C\xE1 Vi\xEAn",
    version: "0.1.0",
    locale: "vi-VN",
    defaultPanSlots: 6,
    maxConcurrentIndex: 2,
    features: {
      guestSession: true,
      sauceSystem: true,
      upgrades: true
    }
  };
  GameConfigResponseSchema.parse(data);
  return c.json({
    success: true,
    data
  });
});
v1.route("/session", sessionRouter);
v1.route("/player", playerRouter);
v1.route("/orders", ordersRouter);
v1.route("/shop", shopRouter);
v1.route("/upgrades", upgradesRouter);
v1.route("/achievements", achievementsRouter);
app.route("/v1", v1);
var universalHandler = async (req, res) => {
  if (!res || typeof res.setHeader !== "function") {
    return app.fetch(req);
  }
  try {
    const protocol = req.headers?.["x-forwarded-proto"] || "https";
    const host = req.headers?.["x-forwarded-host"] || req.headers?.host || "localhost";
    const originalUrl = req.headers?.["x-matched-path"] || req.headers?.["x-invoke-path"] || req.headers?.["x-forwarded-uri"] || req.url || "/api";
    const url = new URL(originalUrl, `${protocol}://${host}`);
    const headers = new Headers();
    if (req.headers) {
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers.set(k, Array.isArray(v) ? v.join(",") : v);
      }
    }
    let body = void 0;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }
    const webReq = new Request(url.toString(), {
      method: req.method || "GET",
      headers,
      body
    });
    const webRes = await app.fetch(webReq);
    res.statusCode = webRes.status;
    const cookies = typeof webRes.headers.getSetCookie === "function" ? webRes.headers.getSetCookie() : null;
    for (const [k, v] of webRes.headers.entries()) {
      if (k.toLowerCase() === "set-cookie" && cookies) continue;
      res.setHeader(k, v);
    }
    if (cookies && cookies.length > 0) {
      res.setHeader("set-cookie", cookies);
    }
    const buf = await webRes.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.error("SERVERLESS HANDLER ERROR:", errorObj);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: "SERVERLESS_INVOCATION_ERROR",
          message: errorObj.message,
          stack: errorObj.stack
        }
      })
    );
  }
};
universalHandler.fetch = app.fetch.bind(app);
var index_default = universalHandler;
export {
  app,
  config,
  index_default as default
};
