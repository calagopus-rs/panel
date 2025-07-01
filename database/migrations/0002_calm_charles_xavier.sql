ALTER TABLE "egg_mounts" RENAME TO "nest_egg_mounts";
ALTER TABLE "nest_egg_mounts" DROP CONSTRAINT "egg_mounts_egg_id_nest_eggs_id_fk";

ALTER TABLE "nest_egg_mounts" DROP CONSTRAINT "egg_mounts_mount_id_mounts_id_fk";

ALTER TABLE "nest_egg_mounts" ADD CONSTRAINT "nest_egg_mounts_egg_id_nest_eggs_id_fk" FOREIGN KEY ("egg_id") REFERENCES "public"."nest_eggs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "nest_egg_mounts" ADD CONSTRAINT "nest_egg_mounts_mount_id_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "public"."mounts"("id") ON DELETE cascade ON UPDATE no action;