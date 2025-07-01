CREATE TABLE "user_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"api_key_id" integer,
	"event" varchar(255) NOT NULL,
	"ip" "inet" NOT NULL,
	"data" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_api_key_id_user_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."user_api_keys"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "user_activities_user_id_idx" ON "user_activities" USING btree ("user_id");
CREATE INDEX "user_activities_event_idx" ON "user_activities" USING btree ("event");