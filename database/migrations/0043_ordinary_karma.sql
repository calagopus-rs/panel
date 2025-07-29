ALTER TABLE "server_backups" DROP CONSTRAINT "server_backups_server_id_servers_id_fk";

ALTER TABLE "server_backups" DROP CONSTRAINT "server_backups_node_id_nodes_id_fk";

ALTER TABLE "server_backups" ALTER COLUMN "server_id" SET NOT NULL;
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;