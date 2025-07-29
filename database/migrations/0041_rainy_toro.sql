ALTER TABLE "server_backups" ADD COLUMN "node_id" integer;
UPDATE "server_backups" SET "node_id" = (SELECT "node_id" FROM "servers" WHERE "servers"."id" = "server_backups"."server_id");
ALTER TABLE "server_backups" ALTER COLUMN "node_id" SET NOT NULL;

ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "mounts_name_idx" ON "mounts" USING btree ("name");