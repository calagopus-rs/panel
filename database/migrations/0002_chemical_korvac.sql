ALTER TABLE "servers" RENAME COLUMN "destination_allocation_id" TO "destination_allocation_uuid";
ALTER TABLE "servers" DROP CONSTRAINT "servers_destination_allocation_id_server_allocations_uuid_fk";

ALTER TABLE "servers" ADD CONSTRAINT "servers_destination_allocation_uuid_server_allocations_uuid_fk" FOREIGN KEY ("destination_allocation_uuid") REFERENCES "public"."server_allocations"("uuid") ON DELETE set null ON UPDATE no action;