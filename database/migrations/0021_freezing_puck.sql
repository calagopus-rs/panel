ALTER TABLE "locations" DROP CONSTRAINT "locations_backup_configuration_uuid_backup_configurations_uuid_fk";

ALTER TABLE "nodes" DROP CONSTRAINT "nodes_backup_configuration_uuid_backup_configurations_uuid_fk";

ALTER TABLE "servers" DROP CONSTRAINT "servers_backup_configuration_uuid_backup_configurations_uuid_fk";

DROP INDEX "servers_uuid_idx";
ALTER TABLE "server_backups" ADD COLUMN "backup_configuration_uuid" uuid;
ALTER TABLE "locations" ADD CONSTRAINT "locations_backup_configuration_uuid_backup_configurations_uuid_fk" FOREIGN KEY ("backup_configuration_uuid") REFERENCES "public"."backup_configurations"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_backup_configuration_uuid_backup_configurations_uuid_fk" FOREIGN KEY ("backup_configuration_uuid") REFERENCES "public"."backup_configurations"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_backups" ADD CONSTRAINT "server_backups_backup_configuration_uuid_backup_configurations_uuid_fk" FOREIGN KEY ("backup_configuration_uuid") REFERENCES "public"."backup_configurations"("uuid") ON DELETE set null ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_backup_configuration_uuid_backup_configurations_uuid_fk" FOREIGN KEY ("backup_configuration_uuid") REFERENCES "public"."backup_configurations"("uuid") ON DELETE set null ON UPDATE no action;