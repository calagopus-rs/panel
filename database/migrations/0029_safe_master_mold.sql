ALTER TABLE "user_oauth_connections" RENAME TO "user_oauth_links";
ALTER TABLE "user_oauth_links" DROP CONSTRAINT "user_oauth_connections_user_uuid_users_uuid_fk";

ALTER TABLE "user_oauth_links" DROP CONSTRAINT "user_oauth_connections_oauth_provider_uuid_oauth_providers_uuid_fk";

DROP INDEX "user_oauth_connections_user_uuid_idx";
DROP INDEX "user_oauth_connections_oauth_provider_uuid_idx";
DROP INDEX "user_oauth_connections_user_uuid_oauth_provider_uuid_idx";
ALTER TABLE "user_oauth_links" ADD CONSTRAINT "user_oauth_links_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_oauth_links" ADD CONSTRAINT "user_oauth_links_oauth_provider_uuid_oauth_providers_uuid_fk" FOREIGN KEY ("oauth_provider_uuid") REFERENCES "public"."oauth_providers"("uuid") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "user_oauth_links_user_uuid_idx" ON "user_oauth_links" USING btree ("user_uuid");
CREATE INDEX "user_oauth_links_oauth_provider_uuid_idx" ON "user_oauth_links" USING btree ("oauth_provider_uuid");
CREATE UNIQUE INDEX "user_oauth_links_user_uuid_oauth_provider_uuid_idx" ON "user_oauth_links" USING btree ("user_uuid","oauth_provider_uuid");