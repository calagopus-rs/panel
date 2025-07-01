ALTER TABLE "database_hosts" ALTER COLUMN "password" SET DATA TYPE bytea USING password::bytea;
ALTER TABLE "nodes" ALTER COLUMN "token" SET DATA TYPE bytea USING token::bytea;
ALTER TABLE "server_databases" ALTER COLUMN "password" SET DATA TYPE bytea USING password::bytea;
ALTER TABLE "user_api_keys" ALTER COLUMN "key" SET DATA TYPE bytea USING key::bytea;
ALTER TABLE "user_sessions" ALTER COLUMN "key" SET DATA TYPE bytea USING key::bytea;
ALTER TABLE "user_ssh_keys" ALTER COLUMN "public_key" SET DATA TYPE bytea USING public_key::bytea;
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE bytea USING password::bytea;