ALTER TABLE "nodes" ADD COLUMN "ssl" boolean DEFAULT false NOT NULL;
ALTER TABLE "nodes" ADD COLUMN "public_sftp_port" integer;
ALTER TABLE "nodes" ADD COLUMN "sftp_port" integer NOT NULL;