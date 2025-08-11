ALTER TABLE "server_backups" ALTER COLUMN "bytes" SET DEFAULT 0;
ALTER TABLE "server_backups" ADD COLUMN "files" bigint DEFAULT 0 NOT NULL;