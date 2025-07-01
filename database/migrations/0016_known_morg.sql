CREATE TABLE "user_recovery_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code" char(10) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "user_ssh_keys" ALTER COLUMN "fingerprint" SET DATA TYPE char(50);
ALTER TABLE "user_recovery_codes" ADD CONSTRAINT "user_recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "user_recovery_codes_user_id_idx" ON "user_recovery_codes" USING btree ("user_id");
CREATE UNIQUE INDEX "user_recovery_codes_user_id_code_idx" ON "user_recovery_codes" USING btree ("user_id","code");
CREATE UNIQUE INDEX "user_api_keys_user_id_key_start_idx" ON "user_api_keys" USING btree ("user_id","key_start");