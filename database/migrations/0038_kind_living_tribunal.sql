ALTER TABLE "server_backups" DROP CONSTRAINT "server_backups_server_id_servers_id_fk";

ALTER TABLE "database_hosts" ALTER COLUMN "type" SET DATA TYPE text;
DROP TYPE "public"."database_type";
CREATE TYPE "public"."database_type" AS ENUM('MYSQL', 'POSTGRES');
ALTER TABLE "database_hosts" ALTER COLUMN "type" SET DATA TYPE "public"."database_type" USING "type"::"public"."database_type";
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE no action ON UPDATE no action;