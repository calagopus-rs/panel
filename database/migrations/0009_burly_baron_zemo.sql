ALTER TABLE "server_allocations" DROP CONSTRAINT "server_allocations_pk";
ALTER TABLE "server_allocations" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;
ALTER TABLE "servers" ADD COLUMN "allocation_id" integer;
ALTER TABLE "servers" ADD CONSTRAINT "servers_allocation_id_server_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."server_allocations"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "server_allocations" DROP COLUMN "primary";