CREATE TYPE "public"."user_toast_position" AS ENUM('TOP_RIGHT', 'BOTTOM_RIGHT', 'TOP_LEFT', 'BOTTOM_LEFT');
ALTER TABLE "users" ADD COLUMN "toast_position" "user_toast_position" DEFAULT 'TOP_RIGHT' NOT NULL;
ALTER TABLE "users" ADD COLUMN "start_on_grouped_servers" boolean DEFAULT true NOT NULL;