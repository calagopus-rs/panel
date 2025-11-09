ALTER TABLE "server_groups" RENAME TO "user_server_groups";
ALTER TABLE "user_server_groups" DROP CONSTRAINT "server_groups_user_uuid_users_uuid_fk";

ALTER TABLE "user_server_groups" ADD CONSTRAINT "user_server_groups_user_uuid_users_uuid_fk" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;