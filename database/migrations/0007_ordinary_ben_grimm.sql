ALTER TABLE "nest_eggs" ADD COLUMN "config_script" jsonb NOT NULL;
ALTER TABLE "nest_eggs" DROP COLUMN "script_container";
ALTER TABLE "nest_eggs" DROP COLUMN "script_entrypoint";
ALTER TABLE "nest_eggs" DROP COLUMN "script_content";