ALTER TABLE "servers" ADD COLUMN "auto_kill" jsonb DEFAULT '{"enabled":false,"seconds":30}'::jsonb NOT NULL;
ALTER TABLE "servers" ADD COLUMN "timezone" varchar(255);