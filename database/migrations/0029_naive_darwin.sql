ALTER TABLE "server_backups" ALTER COLUMN "ignored_files" SET DATA TYPE text[];
ALTER TABLE "server_backups" ALTER COLUMN "checksum" DROP NOT NULL;