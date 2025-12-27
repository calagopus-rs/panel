ALTER TABLE "user_api_keys" ADD COLUMN "allowed_ips" "inet"[] DEFAULT '{}' NOT NULL;
ALTER TABLE "user_api_keys" ADD COLUMN "expires" timestamp;