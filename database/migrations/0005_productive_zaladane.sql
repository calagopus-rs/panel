CREATE TABLE "server_schedule_steps" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_schedule_uuid" uuid NOT NULL,
	"order_" smallint DEFAULT 0 NOT NULL,
	"error" text,
	"action" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_schedules" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_uuid" uuid NOT NULL,
	"name" varchar(31) NOT NULL,
	"enabled" boolean NOT NULL,
	"triggers" jsonb NOT NULL,
	"condition" jsonb NOT NULL,
	"last_run" timestamp,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "servers" ALTER COLUMN "allocation_limit" SET DEFAULT 0;
ALTER TABLE "servers" ALTER COLUMN "database_limit" SET DEFAULT 0;
ALTER TABLE "servers" ALTER COLUMN "backup_limit" SET DEFAULT 0;
ALTER TABLE "servers" ADD COLUMN "schedule_limit" integer DEFAULT 0 NOT NULL;
ALTER TABLE "server_schedule_steps" ADD CONSTRAINT "server_schedule_steps_server_schedule_uuid_server_schedules_uuid_fk" FOREIGN KEY ("server_schedule_uuid") REFERENCES "public"."server_schedules"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "server_schedules" ADD CONSTRAINT "server_schedules_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE no action ON UPDATE no action;
CREATE INDEX "server_schedule_steps_server_schedule_uuid_idx" ON "server_schedule_steps" USING btree ("server_schedule_uuid");
CREATE INDEX "server_schedules_server_uuid_idx" ON "server_schedules" USING btree ("server_uuid");
CREATE INDEX "server_schedules_uuid_enabled_idx" ON "server_schedules" USING btree ("uuid","enabled");