CREATE TABLE "backup_configurations" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(1020) NOT NULL,
	"description" text,
	"backup_disk" "backup_disk" DEFAULT 'LOCAL' NOT NULL,
	"backup_configs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "locations" ADD COLUMN "backup_configuration_uuid" uuid;
ALTER TABLE "nodes" ADD COLUMN "backup_configuration_uuid" uuid;
ALTER TABLE "servers" ADD COLUMN "backup_configuration_uuid" uuid;
CREATE UNIQUE INDEX "backup_configurations_name_idx" ON "backup_configurations" USING btree ("name");
ALTER TABLE "locations" ADD CONSTRAINT "locations_backup_configuration_uuid_backup_configurations_uuid_fk" FOREIGN KEY ("backup_configuration_uuid") REFERENCES "public"."backup_configurations"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_backup_configuration_uuid_backup_configurations_uuid_fk" FOREIGN KEY ("backup_configuration_uuid") REFERENCES "public"."backup_configurations"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "servers" ADD CONSTRAINT "servers_backup_configuration_uuid_backup_configurations_uuid_fk" FOREIGN KEY ("backup_configuration_uuid") REFERENCES "public"."backup_configurations"("uuid") ON DELETE no action ON UPDATE no action;
ALTER TABLE "locations" DROP COLUMN "backup_disk";
ALTER TABLE "locations" DROP COLUMN "backup_configs";