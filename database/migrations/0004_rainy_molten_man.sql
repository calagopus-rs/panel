CREATE TYPE "public"."database_type" AS ENUM('MARIADB', 'POSTGRESQL');
ALTER TABLE "database_hosts" ADD COLUMN "type" "database_type" NOT NULL;