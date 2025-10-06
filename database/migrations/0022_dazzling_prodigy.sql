ALTER TABLE "server_backups" ADD COLUMN "browsable" boolean DEFAULT false NOT NULL;
ALTER TABLE "server_backups" ADD COLUMN "streaming" boolean DEFAULT false NOT NULL;