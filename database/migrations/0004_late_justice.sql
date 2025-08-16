ALTER TABLE "server_databases" DROP COLUMN "id";
ALTER TABLE "server_databases" ADD COLUMN "uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;