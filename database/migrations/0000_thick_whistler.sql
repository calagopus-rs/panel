CREATE TYPE "public"."backup_disk" AS ENUM('LOCAL', 'S3', 'DDUP_BAK', 'BTRFS', 'ZFS', 'RESTIC');
CREATE TYPE "public"."database_type" AS ENUM('MYSQL', 'POSTGRES');
CREATE TYPE "public"."server_status" AS ENUM('INSTALLING', 'INSTALL_FAILED', 'REINSTALL_FAILED', 'RESTORING_BACKUP');
CREATE TABLE "admin_activities" (
	"user_uuid" uuid,
	"api_key_uuid" uuid,
	"event" varchar(255) NOT NULL,
	"ip" "inet",
	"data" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "database_hosts" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"public" boolean DEFAULT false NOT NULL,
	"type" "database_type" NOT NULL,
	"public_host" varchar(255),
	"host" varchar(255) NOT NULL,
	"public_port" integer,
	"port" integer NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" "bytea" NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "location_database_hosts" (
	"location_uuid" uuid NOT NULL,
	"database_host_uuid" uuid NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "location_database_hosts_pk" PRIMARY KEY("location_uuid","database_host_uuid")
);

CREATE TABLE "locations" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_name" varchar(31) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"backup_disk" "backup_disk" DEFAULT 'LOCAL' NOT NULL,
	"backup_configs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mounts" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"source" varchar(255) NOT NULL,
	"target" varchar(255) NOT NULL,
	"read_only" boolean DEFAULT false NOT NULL,
	"user_mountable" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "nest_egg_mounts" (
	"egg_uuid" uuid NOT NULL,
	"mount_uuid" uuid NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "egg_mounts_pk" PRIMARY KEY("egg_uuid","mount_uuid")
);

CREATE TABLE "nest_egg_variables" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"egg_uuid" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"order_" smallint DEFAULT 0 NOT NULL,
	"env_variable" varchar(255) NOT NULL,
	"default_value" text,
	"user_viewable" boolean DEFAULT true NOT NULL,
	"user_editable" boolean DEFAULT false NOT NULL,
	"rules" text[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "nest_eggs" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nest_uuid" uuid NOT NULL,
	"author" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"config_files" jsonb NOT NULL,
	"config_startup" jsonb NOT NULL,
	"config_stop" jsonb NOT NULL,
	"config_script" jsonb NOT NULL,
	"config_allocations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"startup" varchar(255) NOT NULL,
	"force_outgoing_ip" boolean DEFAULT false NOT NULL,
	"features" text[] NOT NULL,
	"docker_images" json NOT NULL,
	"file_denylist" text[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "nests" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "node_allocations" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_uuid" uuid NOT NULL,
	"ip" "inet" NOT NULL,
	"ip_alias" varchar(255),
	"port" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "node_mounts" (
	"node_uuid" uuid NOT NULL,
	"mount_uuid" uuid NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "node_mounts_pk" PRIMARY KEY("node_uuid","mount_uuid")
);

CREATE TABLE "nodes" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_uuid" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"public" boolean NOT NULL,
	"description" text,
	"public_url" varchar(255),
	"url" varchar(255) NOT NULL,
	"sftp_host" varchar(255),
	"sftp_port" integer NOT NULL,
	"maintenance_message" text,
	"memory" bigint NOT NULL,
	"disk" bigint NOT NULL,
	"token_id" char(16) NOT NULL,
	"token" "bytea" NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_activities" (
	"server_uuid" uuid NOT NULL,
	"user_uuid" uuid,
	"api_key_uuid" uuid,
	"event" varchar(255) NOT NULL,
	"ip" "inet",
	"data" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_allocations" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_uuid" uuid NOT NULL,
	"allocation_uuid" uuid NOT NULL,
	"notes" text,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_backups" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_uuid" uuid,
	"node_uuid" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"successful" boolean DEFAULT false NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"ignored_files" text[] NOT NULL,
	"checksum" varchar(255),
	"bytes" bigint DEFAULT 0 NOT NULL,
	"files" bigint DEFAULT 0 NOT NULL,
	"disk" "backup_disk" NOT NULL,
	"upload_id" text,
	"upload_path" text,
	"completed" timestamp,
	"deleted" timestamp,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_databases" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_uuid" uuid NOT NULL,
	"database_host_uuid" uuid NOT NULL,
	"name" varchar(31) NOT NULL,
	"username" varchar(31) NOT NULL,
	"password" "bytea" NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_mounts" (
	"server_uuid" uuid NOT NULL,
	"mount_uuid" uuid NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_mounts_pk" PRIMARY KEY("server_uuid","mount_uuid")
);

CREATE TABLE "server_subusers" (
	"server_uuid" uuid NOT NULL,
	"user_uuid" uuid NOT NULL,
	"permissions" varchar(32)[] NOT NULL,
	"ignored_files" text[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_subusers_pk" PRIMARY KEY("server_uuid","user_uuid")
);

CREATE TABLE "server_variables" (
	"server_uuid" uuid NOT NULL,
	"variable_uuid" uuid NOT NULL,
	"value" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_variables_pk" PRIMARY KEY("server_uuid","variable_uuid")
);

CREATE TABLE "servers" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"uuid_short" integer NOT NULL,
	"external_id" varchar(255),
	"allocation_uuid" uuid,
	"destination_allocation_id" uuid,
	"node_uuid" uuid NOT NULL,
	"destination_node_uuid" uuid,
	"owner_uuid" uuid NOT NULL,
	"egg_uuid" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "server_status",
	"suspended" boolean DEFAULT false NOT NULL,
	"memory" bigint NOT NULL,
	"swap" bigint NOT NULL,
	"disk" bigint NOT NULL,
	"io_weight" smallint,
	"cpu" integer NOT NULL,
	"pinned_cpus" smallint[] NOT NULL,
	"startup" varchar(255) NOT NULL,
	"image" varchar(255) NOT NULL,
	"auto_kill" jsonb DEFAULT '{"enabled":false,"seconds":30}'::jsonb NOT NULL,
	"timezone" varchar(255),
	"allocation_limit" integer NOT NULL,
	"database_limit" integer NOT NULL,
	"backup_limit" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);

CREATE TABLE "user_activities" (
	"user_uuid" uuid NOT NULL,
	"api_key_uuid" uuid,
	"event" varchar(255) NOT NULL,
	"ip" "inet" NOT NULL,
	"data" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_api_keys" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_uuid" uuid NOT NULL,
	"name" varchar(31) NOT NULL,
	"key_start" char(16) NOT NULL,
	"key" text NOT NULL,
	"permissions" varchar(32)[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp
);

CREATE TABLE "user_password_resets" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_uuid" uuid NOT NULL,
	"token" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_recovery_codes" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_uuid" uuid NOT NULL,
	"code" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_sessions" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_uuid" uuid NOT NULL,
	"key_id" char(16) NOT NULL,
	"key" text NOT NULL,
	"ip" "inet" NOT NULL,
	"user_agent" varchar(255) NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_ssh_keys" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_uuid" uuid NOT NULL,
	"name" varchar(31) NOT NULL,
	"fingerprint" char(50) NOT NULL,
	"public_key" "bytea" NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(255),
	"avatar" varchar(255),
	"username" varchar(15) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name_first" varchar(255) NOT NULL,
	"name_last" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"totp_secret" char(32),
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_api_key_uuid_user_api_keys_uuid_fk" FOREIGN KEY ("api_key_uuid") REFERENCES "public"."user_api_keys"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "location_database_hosts" ADD CONSTRAINT "location_database_hosts_location_uuid_locations_uuid_fk" FOREIGN KEY ("location_uuid") REFERENCES "public"."locations"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "location_database_hosts" ADD CONSTRAINT "location_database_hosts_database_host_uuid_database_hosts_uuid_fk" FOREIGN KEY ("database_host_uuid") REFERENCES "public"."database_hosts"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nest_egg_mounts" ADD CONSTRAINT "nest_egg_mounts_egg_uuid_nest_eggs_uuid_fk" FOREIGN KEY ("egg_uuid") REFERENCES "public"."nest_eggs"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nest_egg_mounts" ADD CONSTRAINT "nest_egg_mounts_mount_uuid_mounts_uuid_fk" FOREIGN KEY ("mount_uuid") REFERENCES "public"."mounts"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nest_egg_variables" ADD CONSTRAINT "nest_egg_variables_egg_uuid_nest_eggs_uuid_fk" FOREIGN KEY ("egg_uuid") REFERENCES "public"."nest_eggs"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nest_eggs" ADD CONSTRAINT "nest_eggs_nest_uuid_nests_uuid_fk" FOREIGN KEY ("nest_uuid") REFERENCES "public"."nests"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "node_allocations" ADD CONSTRAINT "node_allocations_node_uuid_nodes_uuid_fk" FOREIGN KEY ("node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "node_mounts" ADD CONSTRAINT "node_mounts_node_uuid_nodes_uuid_fk" FOREIGN KEY ("node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "node_mounts" ADD CONSTRAINT "node_mounts_mount_uuid_mounts_uuid_fk" FOREIGN KEY ("mount_uuid") REFERENCES "public"."mounts"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_location_uuid_locations_uuid_fk" FOREIGN KEY ("location_uuid") REFERENCES "public"."locations"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "server_activities" ADD CONSTRAINT "server_activities_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_activities" ADD CONSTRAINT "server_activities_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_activities" ADD CONSTRAINT "server_activities_api_key_uuid_user_api_keys_uuid_fk" FOREIGN KEY ("api_key_uuid") REFERENCES "public"."user_api_keys"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_allocations" ADD CONSTRAINT "server_allocations_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_allocations" ADD CONSTRAINT "server_allocations_allocation_uuid_node_allocations_uuid_fk" FOREIGN KEY ("allocation_uuid") REFERENCES "public"."node_allocations"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_node_uuid_nodes_uuid_fk" FOREIGN KEY ("node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_databases" ADD CONSTRAINT "server_databases_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "server_databases" ADD CONSTRAINT "server_databases_database_host_uuid_database_hosts_uuid_fk" FOREIGN KEY ("database_host_uuid") REFERENCES "public"."database_hosts"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "server_mounts" ADD CONSTRAINT "server_mounts_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_mounts" ADD CONSTRAINT "server_mounts_mount_uuid_mounts_uuid_fk" FOREIGN KEY ("mount_uuid") REFERENCES "public"."mounts"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_subusers" ADD CONSTRAINT "server_subusers_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_subusers" ADD CONSTRAINT "server_subusers_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_server_uuid_servers_uuid_fk" FOREIGN KEY ("server_uuid") REFERENCES "public"."servers"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_variable_uuid_nest_egg_variables_uuid_fk" FOREIGN KEY ("variable_uuid") REFERENCES "public"."nest_egg_variables"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_allocation_uuid_server_allocations_uuid_fk" FOREIGN KEY ("allocation_uuid") REFERENCES "public"."server_allocations"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_destination_allocation_id_server_allocations_uuid_fk" FOREIGN KEY ("destination_allocation_id") REFERENCES "public"."server_allocations"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_node_uuid_nodes_uuid_fk" FOREIGN KEY ("node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_destination_node_uuid_nodes_uuid_fk" FOREIGN KEY ("destination_node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_owner_uuid_users_uuid_fk" FOREIGN KEY ("owner_uuid") REFERENCES "public"."users"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_egg_uuid_nest_eggs_uuid_fk" FOREIGN KEY ("egg_uuid") REFERENCES "public"."nest_eggs"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_api_key_uuid_user_api_keys_uuid_fk" FOREIGN KEY ("api_key_uuid") REFERENCES "public"."user_api_keys"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_password_resets" ADD CONSTRAINT "user_password_resets_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_recovery_codes" ADD CONSTRAINT "user_recovery_codes_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_ssh_keys" ADD CONSTRAINT "user_ssh_keys_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "admin_activities_user_uuid_idx" ON "admin_activities" USING btree ("user_uuid");
CREATE INDEX "admin_activities_event_idx" ON "admin_activities" USING btree ("event");
CREATE INDEX "admin_activities_user_uuid_event_idx" ON "admin_activities" USING btree ("user_uuid","event");
CREATE UNIQUE INDEX "database_hosts_name_idx" ON "database_hosts" USING btree ("name");
CREATE UNIQUE INDEX "database_hosts_host_port_idx" ON "database_hosts" USING btree ("host","port");
CREATE UNIQUE INDEX "locations_short_idx" ON "locations" USING btree ("short_name");
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" USING btree ("name");
CREATE UNIQUE INDEX "mounts_name_idx" ON "mounts" USING btree ("name");
CREATE UNIQUE INDEX "mounts_source_target_idx" ON "mounts" USING btree ("source","target");
CREATE INDEX "egg_mounts_egg_uuid_idx" ON "nest_egg_mounts" USING btree ("egg_uuid");
CREATE INDEX "egg_mounts_mount_uuid_idx" ON "nest_egg_mounts" USING btree ("mount_uuid");
CREATE INDEX "egg_variables_egg_uuid_idx" ON "nest_egg_variables" USING btree ("egg_uuid");
CREATE UNIQUE INDEX "egg_variables_egg_uuid_name_idx" ON "nest_egg_variables" USING btree ("egg_uuid","name");
CREATE UNIQUE INDEX "egg_variables_egg_uuid_env_variable_idx" ON "nest_egg_variables" USING btree ("egg_uuid","env_variable");
CREATE INDEX "eggs_nest_uuid_idx" ON "nest_eggs" USING btree ("nest_uuid");
CREATE UNIQUE INDEX "eggs_nest_uuid_name_idx" ON "nest_eggs" USING btree ("nest_uuid","name");
CREATE UNIQUE INDEX "nests_name_idx" ON "nests" USING btree ("name");
CREATE INDEX "allocations_node_uuid_idx" ON "node_allocations" USING btree ("node_uuid");
CREATE UNIQUE INDEX "allocations_node_uuid_port_idx" ON "node_allocations" USING btree ("node_uuid","port");
CREATE INDEX "node_mounts_node_uuid_idx" ON "node_mounts" USING btree ("node_uuid");
CREATE INDEX "node_mounts_mount_uuid_idx" ON "node_mounts" USING btree ("mount_uuid");
CREATE UNIQUE INDEX "nodes_uuid_idx" ON "nodes" USING btree ("uuid");
CREATE UNIQUE INDEX "nodes_name_idx" ON "nodes" USING btree ("name");
CREATE UNIQUE INDEX "nodes_token_id_idx" ON "nodes" USING btree ("token_id");
CREATE UNIQUE INDEX "nodes_token_idx" ON "nodes" USING btree ("token");
CREATE INDEX "server_activities_server_uuid_idx" ON "server_activities" USING btree ("server_uuid");
CREATE INDEX "server_activities_user_uuid_idx" ON "server_activities" USING btree ("user_uuid");
CREATE INDEX "server_activities_server_uuid_event_idx" ON "server_activities" USING btree ("server_uuid","event");
CREATE INDEX "server_activities_user_uuid_event_idx" ON "server_activities" USING btree ("user_uuid","event");
CREATE INDEX "server_allocations_server_uuid_idx" ON "server_allocations" USING btree ("server_uuid");
CREATE UNIQUE INDEX "server_allocations_allocation_uuid_idx" ON "server_allocations" USING btree ("allocation_uuid");
CREATE INDEX "server_backups_server_uuid_idx" ON "server_backups" USING btree ("server_uuid");
CREATE UNIQUE INDEX "server_backups_uuid_idx" ON "server_backups" USING btree ("uuid");
CREATE INDEX "server_databases_server_uuid_idx" ON "server_databases" USING btree ("server_uuid");
CREATE UNIQUE INDEX "server_databases_server_uuid_database_idx" ON "server_databases" USING btree ("server_uuid","name");
CREATE INDEX "server_mounts_server_uuid_idx" ON "server_mounts" USING btree ("server_uuid");
CREATE INDEX "server_mounts_mount_uuid_idx" ON "server_mounts" USING btree ("mount_uuid");
CREATE INDEX "server_subusers_server_uuid_idx" ON "server_subusers" USING btree ("server_uuid");
CREATE INDEX "server_subusers_user_uuid_idx" ON "server_subusers" USING btree ("user_uuid");
CREATE INDEX "server_variables_server_uuid_idx" ON "server_variables" USING btree ("server_uuid");
CREATE INDEX "server_variables_variable_uuid_idx" ON "server_variables" USING btree ("variable_uuid");
CREATE INDEX "servers_node_uuid_idx" ON "servers" USING btree ("node_uuid");
CREATE UNIQUE INDEX "servers_uuid_idx" ON "servers" USING btree ("uuid");
CREATE UNIQUE INDEX "servers_uuid_short_idx" ON "servers" USING btree ("uuid_short");
CREATE INDEX "servers_external_id_idx" ON "servers" USING btree ("external_id");
CREATE INDEX "servers_owner_uuid_idx" ON "servers" USING btree ("owner_uuid");
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" USING btree ("key");
CREATE INDEX "user_activities_user_id_idx" ON "user_activities" USING btree ("user_uuid");
CREATE INDEX "user_activities_user_id_event_idx" ON "user_activities" USING btree ("user_uuid","event");
CREATE INDEX "user_api_keys_user_uuid_idx" ON "user_api_keys" USING btree ("user_uuid");
CREATE UNIQUE INDEX "user_api_keys_user_uuid_name_idx" ON "user_api_keys" USING btree ("user_uuid","name");
CREATE UNIQUE INDEX "user_api_keys_user_uuid_key_start_idx" ON "user_api_keys" USING btree ("user_uuid","key_start");
CREATE UNIQUE INDEX "user_api_keys_key_idx" ON "user_api_keys" USING btree ("key");
CREATE INDEX "user_password_resets_user_uuid_idx" ON "user_password_resets" USING btree ("user_uuid");
CREATE UNIQUE INDEX "user_password_resets_token_idx" ON "user_password_resets" USING btree ("token");
CREATE INDEX "user_recovery_codes_user_uuid_idx" ON "user_recovery_codes" USING btree ("user_uuid");
CREATE UNIQUE INDEX "user_recovery_codes_user_uuid_code_idx" ON "user_recovery_codes" USING btree ("user_uuid","code");
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_uuid");
CREATE UNIQUE INDEX "user_sessions_key_idx" ON "user_sessions" USING btree ("key");
CREATE INDEX "user_ssh_keys_user_uuid_idx" ON "user_ssh_keys" USING btree ("user_uuid");
CREATE UNIQUE INDEX "user_ssh_keys_user_uuid_name_idx" ON "user_ssh_keys" USING btree ("user_uuid","name");
CREATE UNIQUE INDEX "user_ssh_keys_user_uuid_fingerprint_idx" ON "user_ssh_keys" USING btree ("user_uuid","fingerprint");
CREATE INDEX "users_external_id_idx" ON "users" USING btree ("external_id");
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");

CREATE EXTENSION pgcrypto;