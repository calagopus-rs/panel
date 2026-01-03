CREATE TYPE "public"."server_autostart_behavior" AS ENUM('ALWAYS', 'UNLESS_STOPPED', 'NEVER');
ALTER TABLE "nest_egg_variables" ADD COLUMN "secret" boolean DEFAULT false NOT NULL;
ALTER TABLE "servers" ADD COLUMN "autostart_behavior" "server_autostart_behavior" DEFAULT 'UNLESS_STOPPED' NOT NULL;