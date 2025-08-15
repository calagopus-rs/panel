DROP INDEX "user_activities_event_idx";
CREATE INDEX "user_activities_user_id_event_idx" ON "user_activities" USING btree ("user_id","event");
ALTER TABLE "user_activities" DROP COLUMN "id";