ALTER TABLE "nodes" ADD COLUMN "public_host" varchar(255);
ALTER TABLE "nodes" ADD COLUMN "host" varchar(255) NOT NULL;
ALTER TABLE "nodes" DROP COLUMN "public_fqdn";
ALTER TABLE "nodes" DROP COLUMN "fqdn";