CREATE TABLE "active_orders" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"items_json" text NOT NULL,
	"requested_sauces_json" text NOT NULL,
	"has_dua_chua" boolean DEFAULT false NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"patience_ms" integer DEFAULT 60000 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "active_orders" ADD CONSTRAINT "active_orders_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_active_orders_player" ON "active_orders" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_player_achievement" ON "player_achievements" USING btree ("player_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_player_food_unlock" ON "player_food_unlocks" USING btree ("player_id","food_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_player_upgrade" ON "player_upgrades" USING btree ("player_id","upgrade_key");