ALTER TABLE "server_schedule_steps" DROP CONSTRAINT "server_schedule_steps_schedule_uuid_server_schedules_uuid_fk";

ALTER TABLE "server_schedules" DROP CONSTRAINT "server_schedules_server_uuid_servers_uuid_fk";

ALTER TABLE "user_security_keys" ALTER COLUMN "credential" DROP NOT NULL;
ALTER TABLE "user_security_keys" ADD COLUMN "registration" jsonb;
ALTER TABLE "server_schedule_steps" ADD CONSTRAINT "server_schedule_steps_schedule_uuid_server_schedules_uuid_fk" FOREIGN KEY ("schedule_uuid") REFERENCES "public"."server_schedules"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_schedules" ADD CONSTRAINT "server_schedules_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE cascade ON UPDATE no action;