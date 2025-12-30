ALTER TABLE "users" ALTER COLUMN "toast_position" SET DEFAULT 'BOTTOM_RIGHT';
ALTER TABLE "users" ALTER COLUMN "start_on_grouped_servers" SET DEFAULT false;
ALTER TABLE "users" ADD COLUMN "totp_last_used" timestamp;