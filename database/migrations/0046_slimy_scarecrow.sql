DROP INDEX "egg_repository_eggs_path_idx";
ALTER TABLE "egg_repository_eggs" ADD COLUMN "egg_repository_uuid" uuid NOT NULL;
ALTER TABLE "egg_repository_eggs" ADD CONSTRAINT "egg_repository_eggs_egg_repository_uuid_egg_repositories_uuid_fk" FOREIGN KEY ("egg_repository_uuid") REFERENCES "public"."egg_repositories"("uuid") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "egg_repository_eggs_egg_repository_uuid_path_idx" ON "egg_repository_eggs" USING btree ("egg_repository_uuid","path");