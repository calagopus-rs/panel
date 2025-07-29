ALTER TABLE "server_backups" DROP CONSTRAINT "server_backups_server_id_servers_id_fk";

ALTER TABLE "server_backups" ALTER COLUMN "server_id" DROP NOT NULL;
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE set null ON UPDATE no action;