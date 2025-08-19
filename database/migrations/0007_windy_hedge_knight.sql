ALTER TABLE "server_schedule_steps" RENAME COLUMN "server_schedule_uuid" TO "schedule_uuid";
ALTER TABLE "server_schedule_steps" DROP CONSTRAINT "server_schedule_steps_server_schedule_uuid_server_schedules_uuid_fk";

DROP INDEX "server_schedule_steps_server_schedule_uuid_idx";
ALTER TABLE "server_schedule_steps" ADD CONSTRAINT "server_schedule_steps_schedule_uuid_server_schedules_uuid_fk" FOREIGN KEY ("schedule_uuid") REFERENCES "public"."server_schedules"("uuid") ON DELETE no action ON UPDATE no action;
CREATE INDEX "server_schedule_steps_schedule_uuid_idx" ON "server_schedule_steps" USING btree ("schedule_uuid");