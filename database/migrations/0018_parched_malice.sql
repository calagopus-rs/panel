ALTER TABLE "nodes" RENAME COLUMN "public_host" TO "public_url";
ALTER TABLE "nodes" RENAME COLUMN "host" TO "url";
CREATE UNIQUE INDEX "database_hosts_name_idx" ON "database_hosts" USING btree ("name");
CREATE UNIQUE INDEX "nodes_name_idx" ON "nodes" USING btree ("name");
ALTER TABLE "nodes" DROP COLUMN "ssl";