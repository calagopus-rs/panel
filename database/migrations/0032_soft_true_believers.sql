ALTER TABLE "oauth_providers" ADD COLUMN "info_url" varchar(64)[] NOT NULL;
ALTER TABLE "oauth_providers" ADD COLUMN "basic_auth" boolean DEFAULT false NOT NULL;