CREATE TYPE "public"."backup_disk" AS ENUM('LOCAL', 'S3', 'DDUP_BAK', 'BTRFS', 'ZFS', 'RESTIC');
ALTER TABLE "server_backups" ALTER COLUMN "disk" SET DATA TYPE "public"."backup_disk" USING "disk"::"public"."backup_disk";
ALTER TABLE "locations" ADD COLUMN "backup_disk" "backup_disk" DEFAULT 'LOCAL' NOT NULL;
ALTER TABLE "locations" ADD COLUMN "backup_configs" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "locations" DROP COLUMN "config_backups";