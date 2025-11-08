CREATE TABLE "oauth_providers" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(1020) NOT NULL,
	"description" text,
	"client_id" varchar(255) NOT NULL,
	"client_secret" varchar(255) NOT NULL,
	"auth_url" varchar(255) NOT NULL,
	"token_url" varchar(255) NOT NULL,
	"scopes" varchar(64)[] NOT NULL,
	"identifier_path" varchar(255) NOT NULL,
	"username_path" varchar(255),
	"first_name_path" varchar(255),
	"last_name_path" varchar(255),
	"enabled" boolean DEFAULT false NOT NULL,
	"login_only" boolean DEFAULT false NOT NULL,
	"user_linkable" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_oauth_connections" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_uuid" uuid NOT NULL,
	"oauth_provider_uuid" uuid NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp
);

DROP INDEX "server_schedules_uuid_enabled_idx";
DROP INDEX "user_recovery_codes_user_uuid_code_idx";
ALTER TABLE "mounts" ALTER COLUMN "name" SET DATA TYPE varchar(1020);
ALTER TABLE "node_allocations" ALTER COLUMN "ip_alias" SET DATA TYPE varchar(255);
ALTER TABLE "roles" ALTER COLUMN "name" SET DATA TYPE varchar(1020);
ALTER TABLE "server_databases" ALTER COLUMN "username" SET DATA TYPE char(20);
ALTER TABLE "user_recovery_codes" ALTER COLUMN "code" SET DATA TYPE char(10);
ALTER TABLE "user_recovery_codes" ADD CONSTRAINT "user_recovery_codes_user_uuid_code_idx" PRIMARY KEY("user_uuid","code");
ALTER TABLE "user_oauth_connections" ADD CONSTRAINT "user_oauth_connections_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_oauth_connections" ADD CONSTRAINT "user_oauth_connections_oauth_provider_uuid_oauth_providers_uuid_fk" FOREIGN KEY ("oauth_provider_uuid") REFERENCES "public"."oauth_providers"("uuid") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "oauth_providers_name_idx" ON "oauth_providers" USING btree ("name");
CREATE INDEX "user_oauth_connections_user_uuid_idx" ON "user_oauth_connections" USING btree ("user_uuid");
CREATE INDEX "user_oauth_connections_oauth_provider_uuid_idx" ON "user_oauth_connections" USING btree ("oauth_provider_uuid");
CREATE UNIQUE INDEX "user_oauth_connections_user_uuid_oauth_provider_uuid_idx" ON "user_oauth_connections" USING btree ("user_uuid","oauth_provider_uuid");
CREATE INDEX "location_database_hosts_location_uuid_idx" ON "location_database_hosts" USING btree ("location_uuid");
CREATE INDEX "location_database_hosts_database_host_uuid_idx" ON "location_database_hosts" USING btree ("database_host_uuid");
CREATE INDEX "locations_backup_configuration_uuid_idx" ON "locations" USING btree ("backup_configuration_uuid");
CREATE INDEX "nodes_location_uuid_idx" ON "nodes" USING btree ("location_uuid");
CREATE INDEX "nodes_backup_configuration_uuid_idx" ON "nodes" USING btree ("backup_configuration_uuid");
CREATE INDEX "server_backups_node_uuid_idx" ON "server_backups" USING btree ("node_uuid");
CREATE INDEX "server_backups_backup_configuration_uuid_idx" ON "server_backups" USING btree ("backup_configuration_uuid");
CREATE INDEX "server_backups_successful_idx" ON "server_backups" USING btree ("successful");
CREATE INDEX "server_databases_database_host_uuid_idx" ON "server_databases" USING btree ("database_host_uuid");
CREATE INDEX "server_schedules_enabled_idx" ON "server_schedules" USING btree ("enabled");
CREATE INDEX "servers_allocation_uuid_idx" ON "servers" USING btree ("allocation_uuid");
CREATE INDEX "servers_egg_uuid_idx" ON "servers" USING btree ("egg_uuid");
CREATE INDEX "servers_backup_configuration_uuid_idx" ON "servers" USING btree ("backup_configuration_uuid");