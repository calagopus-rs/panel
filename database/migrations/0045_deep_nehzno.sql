ALTER TABLE "nest_eggs" DROP CONSTRAINT "nest_eggs_egg_repository_egg_path_egg_repository_eggs_path_fk";

ALTER TABLE "egg_repository_eggs" DROP CONSTRAINT "egg_repository_eggs_pk";
ALTER TABLE "egg_repository_eggs" ADD COLUMN "uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "nest_eggs" ADD COLUMN "egg_repository_egg_uuid" uuid;
ALTER TABLE "nest_eggs" ADD CONSTRAINT "nest_eggs_egg_repository_egg_uuid_egg_repository_eggs_uuid_fk" FOREIGN KEY ("egg_repository_egg_uuid") REFERENCES "public"."egg_repository_eggs"("uuid") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "egg_repository_eggs_path_idx" ON "egg_repository_eggs" USING btree ("path");
ALTER TABLE "nest_eggs" DROP COLUMN "egg_repository_egg_path";