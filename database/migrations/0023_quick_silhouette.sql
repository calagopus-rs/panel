CREATE TABLE "user_password_resets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "user_recovery_codes" ALTER COLUMN "code" SET DATA TYPE text;
ALTER TABLE "user_password_resets" ADD CONSTRAINT "user_password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "user_password_resets_user_id_idx" ON "user_password_resets" USING btree ("user_id");
CREATE UNIQUE INDEX "user_password_resets_token_idx" ON "user_password_resets" USING btree ("token");