ALTER TABLE "nest_egg_variables" ALTER COLUMN "rules" SET DATA TYPE text[];
CREATE UNIQUE INDEX "egg_variables_egg_id_env_variable_idx" ON "nest_egg_variables" USING btree ("egg_id","env_variable");