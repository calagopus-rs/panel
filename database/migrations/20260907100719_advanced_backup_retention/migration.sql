ALTER TABLE "server_backup_groups" ADD COLUMN "retention" jsonb DEFAULT '{"count":0,"days":0,"daily":0,"weekly":0,"monthly":0,"yearly":0}' NOT NULL;
ALTER TABLE "system_backup_policies" ADD COLUMN "retention" jsonb DEFAULT '{"count":0,"days":0,"daily":0,"weekly":0,"monthly":0,"yearly":0}' NOT NULL;
UPDATE "server_backup_groups"
SET "retention" = jsonb_build_object(
    'count', COALESCE("retention_count", 0),
    'days', COALESCE("retention_days", 0),
    'daily', 0,
    'weekly', 0,
    'monthly', 0,
    'yearly', 0
);
UPDATE "system_backup_policies"
SET "retention" = jsonb_build_object(
    'count', COALESCE("retention_count", 0),
    'days', COALESCE("retention_days", 0),
    'daily', 0,
    'weekly', 0,
    'monthly', 0,
    'yearly', 0
);
ALTER TABLE "server_backup_groups" DROP COLUMN "retention_count";
ALTER TABLE "server_backup_groups" DROP COLUMN "retention_days";
ALTER TABLE "system_backup_policies" DROP COLUMN "retention_count";
ALTER TABLE "system_backup_policies" DROP COLUMN "retention_days";
