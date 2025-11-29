ALTER TABLE "nest_eggs" ADD COLUMN "egg_repository_egg_path" text;
ALTER TABLE "nest_eggs" ADD CONSTRAINT "nest_eggs_egg_repository_egg_path_egg_repository_eggs_path_fk" FOREIGN KEY ("egg_repository_egg_path") REFERENCES "public"."egg_repository_eggs"("path") ON DELETE no action ON UPDATE no action;
ALTER TABLE "egg_repository_eggs" DROP COLUMN "created";