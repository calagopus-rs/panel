CREATE TABLE "server_groups" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"user_uuid" uuid NOT NULL,
	"name" varchar(124) NOT NULL,
	"order_" smallint DEFAULT 0 NOT NULL,
	"server_order" uuid[] DEFAULT '{}' NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "node_allocations" DROP CONSTRAINT "node_allocations_node_uuid_nodes_uuid_fk";

ALTER TABLE "server_groups" ADD CONSTRAINT "server_groups_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "server_groups_user_uuid_idx" ON "server_groups" USING btree ("user_uuid");
ALTER TABLE "node_allocations" ADD CONSTRAINT "node_allocations_node_uuid_nodes_uuid_fk" FOREIGN KEY ("node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE cascade ON UPDATE no action;