ALTER TABLE "nest_eggs" DROP CONSTRAINT "nest_eggs_egg_repository_egg_uuid_egg_repository_eggs_uuid_fk";

ALTER TABLE "nest_eggs" ADD CONSTRAINT "nest_eggs_egg_repository_egg_uuid_egg_repository_eggs_uuid_fk" FOREIGN KEY ("egg_repository_egg_uuid") REFERENCES "public"."egg_repository_eggs"("uuid") ON DELETE set null ON UPDATE no action;