CREATE TABLE "admin_activities" (
	"user_id" integer,
	"api_key_id" integer,
	"event" varchar(255) NOT NULL,
	"ip" "inet",
	"data" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_api_key_id_user_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."user_api_keys"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "admin_activities_user_id_idx" ON "admin_activities" USING btree ("user_id");
CREATE INDEX "admin_activities_event_idx" ON "admin_activities" USING btree ("event");
CREATE INDEX "admin_activities_user_id_event_idx" ON "admin_activities" USING btree ("user_id","event");
ALTER TABLE "server_activities" DROP COLUMN "id";