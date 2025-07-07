ALTER TABLE "nest_eggs" ALTER COLUMN "features" SET DATA TYPE text[];
ALTER TABLE "nest_eggs" ALTER COLUMN "file_denylist" SET DATA TYPE text[];
CREATE UNIQUE INDEX "eggs_nest_id_name_idx" ON "nest_eggs" USING btree ("nest_id","name");