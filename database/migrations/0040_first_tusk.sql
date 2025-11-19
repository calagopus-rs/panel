ALTER TABLE "servers" ALTER COLUMN "status" SET DATA TYPE text;
DROP TYPE "public"."server_status";
CREATE TYPE "public"."server_status" AS ENUM('INSTALLING', 'INSTALL_FAILED', 'RESTORING_BACKUP');
ALTER TABLE "servers" ALTER COLUMN "status" SET DATA TYPE "public"."server_status" USING "status"::"public"."server_status";