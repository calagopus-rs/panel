DROP INDEX "allocations_node_uuid_port_idx";
DROP INDEX "users_external_id_idx";
DROP INDEX "users_email_idx";
CREATE UNIQUE INDEX "allocations_node_uuid_ip_port_idx" ON "node_allocations" USING btree ("node_uuid",host("ip"),"port");
CREATE UNIQUE INDEX "users_external_id_idx" ON "users" USING btree ("external_id");
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));