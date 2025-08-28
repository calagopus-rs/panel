CREATE TABLE "user_security_keys" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_uuid" uuid NOT NULL,
	"name" varchar(31) NOT NULL,
	"credential_id" "bytea" NOT NULL,
	"credential" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp
);

ALTER TABLE "user_security_keys" ADD CONSTRAINT "user_security_keys_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "user_security_keys_user_uuid_idx" ON "user_security_keys" USING btree ("user_uuid");
CREATE UNIQUE INDEX "user_security_keys_user_uuid_name_idx" ON "user_security_keys" USING btree ("user_uuid","name");
CREATE UNIQUE INDEX "user_security_keys_user_uuid_credential_id_idx" ON "user_security_keys" USING btree ("user_uuid","credential_id");