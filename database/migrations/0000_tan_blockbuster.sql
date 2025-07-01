CREATE TYPE "public"."server_status" AS ENUM('INSTALLING', 'INSTALL_FAILED', 'REINSTALL_FAILED', 'SUSPENDED', 'RESTORING_BACKUP');
CREATE TABLE "allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_id" integer NOT NULL,
	"ip" "inet" NOT NULL,
	"ip_alias" varchar(255),
	"port" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "database_hosts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"public_host" varchar(255),
	"host" varchar(255) NOT NULL,
	"public_port" integer,
	"port" integer NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "egg_mounts" (
	"egg_id" integer NOT NULL,
	"mount_id" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "egg_mounts_pk" PRIMARY KEY("egg_id","mount_id")
);

CREATE TABLE "egg_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"egg_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"env_variable" varchar(255) NOT NULL,
	"default_value" text,
	"user_viewable" boolean DEFAULT true NOT NULL,
	"user_editable" boolean DEFAULT false NOT NULL,
	"rules" varchar(255)[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "eggs" (
	"id" serial PRIMARY KEY NOT NULL,
	"nest_id" integer NOT NULL,
	"author" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"config_files" jsonb NOT NULL,
	"config_startup" jsonb NOT NULL,
	"config_logs" jsonb NOT NULL,
	"config_stop" jsonb NOT NULL,
	"startup" varchar(255) NOT NULL,
	"script_container" varchar(255) NOT NULL,
	"script_entrypoint" varchar(255) NOT NULL,
	"script_content" text NOT NULL,
	"features" varchar(255)[] NOT NULL,
	"docker_images" jsonb NOT NULL,
	"file_denylist" varchar(255)[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"short" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "mounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"source" varchar(255) NOT NULL,
	"target" varchar(255) NOT NULL,
	"read_only" boolean DEFAULT false NOT NULL,
	"user_mountable" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "nests" (
	"id" serial PRIMARY KEY NOT NULL,
	"author" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "node_mounts" (
	"node_id" integer NOT NULL,
	"mount_id" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "node_mounts_pk" PRIMARY KEY("node_id","mount_id")
);

CREATE TABLE "nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"location_id" integer NOT NULL,
	"database_host_id" integer,
	"name" varchar(255) NOT NULL,
	"public" boolean NOT NULL,
	"description" text,
	"public_fqdn" varchar(255),
	"fqdn" varchar(255) NOT NULL,
	"maintenance_message" text,
	"memory" bigint NOT NULL,
	"disk" bigint NOT NULL,
	"token_id" char(16) NOT NULL,
	"token" varchar(255) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"user_id" integer,
	"api_key_id" integer,
	"event" varchar(255) NOT NULL,
	"ip" "inet" NOT NULL,
	"data" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_allocations" (
	"server_id" integer NOT NULL,
	"allocation_id" integer NOT NULL,
	"notes" text,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_allocations_pk" PRIMARY KEY("server_id","allocation_id")
);

CREATE TABLE "server_backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"server_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"successful" boolean DEFAULT false NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"ignored_files" varchar(255)[] NOT NULL,
	"checksum" varchar(255) NOT NULL,
	"bytes" bigint NOT NULL,
	"disk" varchar(31) NOT NULL,
	"completed" timestamp,
	"deleted" timestamp,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_databases" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"database_host_id" integer NOT NULL,
	"name" varchar(31) NOT NULL,
	"username" varchar(31) NOT NULL,
	"password" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "server_mounts" (
	"server_id" integer NOT NULL,
	"mount_id" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_mounts_pk" PRIMARY KEY("server_id","mount_id")
);

CREATE TABLE "server_subusers" (
	"server_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"permissions" varchar(32)[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_subusers_pk" PRIMARY KEY("server_id","user_id")
);

CREATE TABLE "server_variables" (
	"server_id" integer NOT NULL,
	"variable_id" integer NOT NULL,
	"value" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_variables_pk" PRIMARY KEY("server_id","variable_id")
);

CREATE TABLE "servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid NOT NULL,
	"uuid_short" integer NOT NULL,
	"external_id" varchar(255),
	"allocation_id" integer NOT NULL,
	"node_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"egg_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "server_status",
	"memory" bigint NOT NULL,
	"swap" bigint NOT NULL,
	"disk" bigint NOT NULL,
	"io" integer NOT NULL,
	"cpu" integer NOT NULL,
	"pinned_cpus" smallint[] NOT NULL,
	"startup" varchar(255) NOT NULL,
	"image" varchar(255) NOT NULL,
	"allocation_limit" integer NOT NULL,
	"database_limit" integer NOT NULL,
	"backup_limit" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);

CREATE TABLE "user_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(31) NOT NULL,
	"key_start" char(8) NOT NULL,
	"key" text NOT NULL,
	"permissions" varchar(32)[] NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp
);

CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"key" text NOT NULL,
	"ip" "inet" NOT NULL,
	"user_agent" varchar(255) NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_ssh_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(31) NOT NULL,
	"fingerprint" varchar(255) NOT NULL,
	"public_key" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(255),
	"username" varchar(15) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name_first" varchar(255) NOT NULL,
	"name_last" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"totp_secret" char(32) DEFAULT '' NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "allocations" ADD CONSTRAINT "allocations_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "egg_mounts" ADD CONSTRAINT "egg_mounts_egg_id_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."eggs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "egg_mounts" ADD CONSTRAINT "egg_mounts_mount_id_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "public"."mounts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "egg_variables" ADD CONSTRAINT "egg_variables_egg_id_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."eggs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "eggs" ADD CONSTRAINT "eggs_nest_id_nests_id_fk" FOREIGN KEY ("nest_id") REFERENCES "public"."nests"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "node_mounts" ADD CONSTRAINT "node_mounts_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "node_mounts" ADD CONSTRAINT "node_mounts_mount_id_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "public"."mounts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_database_host_id_database_hosts_id_fk" FOREIGN KEY ("database_host_id") REFERENCES "public"."database_hosts"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_activities" ADD CONSTRAINT "server_activities_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_activities" ADD CONSTRAINT "server_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_activities" ADD CONSTRAINT "server_activities_api_key_id_user_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."user_api_keys"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_allocations" ADD CONSTRAINT "server_allocations_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_allocations" ADD CONSTRAINT "server_allocations_allocation_id_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."allocations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_databases" ADD CONSTRAINT "server_databases_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "server_databases" ADD CONSTRAINT "server_databases_database_host_id_database_hosts_id_fk" FOREIGN KEY ("database_host_id") REFERENCES "public"."database_hosts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "server_mounts" ADD CONSTRAINT "server_mounts_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_mounts" ADD CONSTRAINT "server_mounts_mount_id_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "public"."mounts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_subusers" ADD CONSTRAINT "server_subusers_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_subusers" ADD CONSTRAINT "server_subusers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_variable_id_egg_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."egg_variables"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_allocation_id_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."allocations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_egg_id_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."eggs"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_ssh_keys" ADD CONSTRAINT "user_ssh_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "allocations_node_id_idx" ON "allocations" USING btree ("node_id");
CREATE UNIQUE INDEX "allocations_node_id_ip_port_idx" ON "allocations" USING btree ("node_id","ip","port");
CREATE UNIQUE INDEX "database_hosts_host_port_idx" ON "database_hosts" USING btree ("host","port");
CREATE INDEX "egg_mounts_egg_id_idx" ON "egg_mounts" USING btree ("egg_id");
CREATE INDEX "egg_mounts_mount_id_idx" ON "egg_mounts" USING btree ("mount_id");
CREATE INDEX "egg_variables_egg_id_idx" ON "egg_variables" USING btree ("egg_id");
CREATE UNIQUE INDEX "egg_variables_egg_id_name_idx" ON "egg_variables" USING btree ("egg_id","name");
CREATE INDEX "eggs_nest_id_idx" ON "eggs" USING btree ("nest_id");
CREATE UNIQUE INDEX "locations_short_idx" ON "locations" USING btree ("short");
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" USING btree ("name");
CREATE UNIQUE INDEX "mounts_source_target_idx" ON "mounts" USING btree ("source","target");
CREATE UNIQUE INDEX "nests_name_idx" ON "nests" USING btree ("name");
CREATE INDEX "node_mounts_node_id_idx" ON "node_mounts" USING btree ("node_id");
CREATE INDEX "node_mounts_mount_id_idx" ON "node_mounts" USING btree ("mount_id");
CREATE UNIQUE INDEX "nodes_uuid_idx" ON "nodes" USING btree ("uuid");
CREATE UNIQUE INDEX "nodes_token_id_idx" ON "nodes" USING btree ("token_id");
CREATE UNIQUE INDEX "nodes_token_idx" ON "nodes" USING btree ("token");
CREATE INDEX "server_activities_server_id_idx" ON "server_activities" USING btree ("server_id");
CREATE INDEX "server_activities_user_id_idx" ON "server_activities" USING btree ("user_id");
CREATE INDEX "server_activities_server_id_event_idx" ON "server_activities" USING btree ("server_id","event");
CREATE INDEX "server_activities_user_id_event_idx" ON "server_activities" USING btree ("user_id","event");
CREATE INDEX "server_allocations_server_id_idx" ON "server_allocations" USING btree ("server_id");
CREATE INDEX "server_allocations_allocation_id_idx" ON "server_allocations" USING btree ("allocation_id");
CREATE INDEX "server_backups_server_id_idx" ON "server_backups" USING btree ("server_id");
CREATE UNIQUE INDEX "server_backups_uuid_idx" ON "server_backups" USING btree ("uuid");
CREATE INDEX "server_databases_server_id_idx" ON "server_databases" USING btree ("server_id");
CREATE UNIQUE INDEX "server_databases_server_id_database_idx" ON "server_databases" USING btree ("server_id","name");
CREATE INDEX "server_mounts_server_id_idx" ON "server_mounts" USING btree ("server_id");
CREATE INDEX "server_mounts_mount_id_idx" ON "server_mounts" USING btree ("mount_id");
CREATE INDEX "server_subusers_server_id_idx" ON "server_subusers" USING btree ("server_id");
CREATE INDEX "server_subusers_user_id_idx" ON "server_subusers" USING btree ("user_id");
CREATE INDEX "server_variables_server_id_idx" ON "server_variables" USING btree ("server_id");
CREATE INDEX "server_variables_variable_id_idx" ON "server_variables" USING btree ("variable_id");
CREATE INDEX "servers_node_id_idx" ON "servers" USING btree ("node_id");
CREATE UNIQUE INDEX "servers_uuid_idx" ON "servers" USING btree ("uuid");
CREATE UNIQUE INDEX "servers_uuid_short_idx" ON "servers" USING btree ("uuid_short");
CREATE INDEX "servers_external_id_idx" ON "servers" USING btree ("external_id");
CREATE INDEX "servers_owner_id_idx" ON "servers" USING btree ("owner_id");
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" USING btree ("key");
CREATE INDEX "user_api_keys_user_id_idx" ON "user_api_keys" USING btree ("user_id");
CREATE UNIQUE INDEX "user_api_keys_user_id_name_idx" ON "user_api_keys" USING btree ("user_id","name");
CREATE UNIQUE INDEX "user_api_keys_key_idx" ON "user_api_keys" USING btree ("key");
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");
CREATE UNIQUE INDEX "user_sessions_key_idx" ON "user_sessions" USING btree ("key");
CREATE INDEX "user_ssh_keys_user_id_idx" ON "user_ssh_keys" USING btree ("user_id");
CREATE UNIQUE INDEX "user_ssh_keys_user_id_name_idx" ON "user_ssh_keys" USING btree ("user_id","name");
CREATE INDEX "users_external_id_idx" ON "users" USING btree ("external_id");
CREATE UNIQUE INDEX "users_uuid_idx" ON "users" USING btree ("uuid");
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");