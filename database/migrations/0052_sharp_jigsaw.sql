ALTER TABLE "users" ALTER COLUMN "toast_position" SET DATA TYPE text;
ALTER TABLE "users" ALTER COLUMN "toast_position" SET DEFAULT 'TOP_RIGHT'::text;
DROP TYPE "public"."user_toast_position";
CREATE TYPE "public"."user_toast_position" AS ENUM('TOP_LEFT', 'TOP_CENTER', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT');
ALTER TABLE "users" ALTER COLUMN "toast_position" SET DEFAULT 'TOP_RIGHT'::"public"."user_toast_position";
ALTER TABLE "users" ALTER COLUMN "toast_position" SET DATA TYPE "public"."user_toast_position" USING "toast_position"::"public"."user_toast_position";