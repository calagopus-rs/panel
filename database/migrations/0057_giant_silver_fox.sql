ALTER TYPE "public"."server_autostart_behavior" RENAME TO "server_auto_start_behavior";
ALTER TABLE "servers" RENAME COLUMN "autostart_behavior" TO "auto_start_behavior";