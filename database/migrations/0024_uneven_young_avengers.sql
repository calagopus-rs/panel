DROP INDEX "users_username_idx";
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree (lower("username"));