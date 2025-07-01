ALTER TABLE "egg_variables" RENAME TO "nest_egg_variables";
ALTER TABLE "nest_egg_variables" DROP CONSTRAINT "egg_variables_egg_id_nest_eggs_id_fk";

ALTER TABLE "server_variables" DROP CONSTRAINT "server_variables_variable_id_egg_variables_id_fk";

ALTER TABLE "nest_egg_variables" ADD CONSTRAINT "nest_egg_variables_egg_id_nest_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."nest_eggs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_variable_id_nest_egg_variables_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."nest_egg_variables"("id") ON DELETE cascade ON UPDATE no action;