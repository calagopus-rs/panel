ALTER TABLE "locations" RENAME COLUMN "short" TO "short_name";
DROP INDEX "locations_short_idx";
CREATE UNIQUE INDEX "locations_short_idx" ON "locations" USING btree ("short_name");