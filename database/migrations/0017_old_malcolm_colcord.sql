ALTER TABLE "roles" ALTER COLUMN "permissions" SET DATA TYPE varchar(64)[];
ALTER TABLE "user_api_keys" ALTER COLUMN "permissions" SET DATA TYPE varchar(64)[];
ALTER TABLE "roles" ADD COLUMN "user_permissions" varchar(64)[] NOT NULL;
ALTER TABLE "roles" ADD COLUMN "admin_permissions" varchar(64)[] NOT NULL;
ALTER TABLE "user_api_keys" ADD COLUMN "user_permissions" varchar(64)[] NOT NULL;
ALTER TABLE "user_api_keys" ADD COLUMN "admin_permissions" varchar(64)[] NOT NULL;