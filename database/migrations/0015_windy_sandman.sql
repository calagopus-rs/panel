CREATE TABLE "roles" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"permissions" varchar(32)[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "users" ADD COLUMN "role_uuid" uuid;
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" USING btree ("name");
ALTER TABLE "users" ADD CONSTRAINT "users_role_uuid_roles_uuid_fk" FOREIGN KEY ("role_uuid") REFERENCES "public"."roles"("uuid") ON DELETE set null ON UPDATE no action;