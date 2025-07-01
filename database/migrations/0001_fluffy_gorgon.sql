ALTER TABLE "eggs" RENAME TO "nest_eggs";
ALTER TABLE "allocations" RENAME TO "node_allocations";
ALTER TABLE "node_allocations" DROP CONSTRAINT "allocations_node_id_nodes_id_fk";

ALTER TABLE "egg_mounts" DROP CONSTRAINT "egg_mounts_egg_id_eggs_id_fk";

ALTER TABLE "egg_variables" DROP CONSTRAINT "egg_variables_egg_id_eggs_id_fk";

ALTER TABLE "nest_eggs" DROP CONSTRAINT "eggs_nest_id_nests_id_fk";

ALTER TABLE "server_allocations" DROP CONSTRAINT "server_allocations_allocation_id_allocations_id_fk";

ALTER TABLE "servers" DROP CONSTRAINT "servers_allocation_id_allocations_id_fk";

ALTER TABLE "servers" DROP CONSTRAINT "servers_egg_id_eggs_id_fk";

DROP INDEX "users_uuid_idx";
DROP INDEX "server_allocations_allocation_id_idx";
ALTER TABLE "user_api_keys" ALTER COLUMN "key_start" SET DATA TYPE char(16);
ALTER TABLE "users" ALTER COLUMN "totp_secret" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "totp_secret" DROP NOT NULL;
ALTER TABLE "server_allocations" ADD COLUMN "primary" boolean DEFAULT false NOT NULL;
ALTER TABLE "node_allocations" ADD CONSTRAINT "node_allocations_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "egg_mounts" ADD CONSTRAINT "egg_mounts_egg_id_nest_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."nest_eggs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "egg_variables" ADD CONSTRAINT "egg_variables_egg_id_nest_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."nest_eggs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nest_eggs" ADD CONSTRAINT "nest_eggs_nest_id_nests_id_fk" FOREIGN KEY ("nest_id") REFERENCES "public"."nests"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "server_allocations" ADD CONSTRAINT "server_allocations_allocation_id_node_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."node_allocations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_egg_id_nest_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."nest_eggs"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "user_ssh_keys_user_id_fingerprint_idx" ON "user_ssh_keys" USING btree ("user_id","fingerprint");
CREATE UNIQUE INDEX "server_allocations_allocation_id_idx" ON "server_allocations" USING btree ("allocation_id");
ALTER TABLE "servers" DROP COLUMN "allocation_id";
ALTER TABLE "users" DROP COLUMN "uuid";