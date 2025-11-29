CREATE TABLE "egg_repository_eggs" (
	"path" text NOT NULL,
	"name" varchar(1020) NOT NULL,
	"description" text,
	"author" varchar(1020) NOT NULL,
	"exported_egg" jsonb NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "egg_repository_eggs_pk" PRIMARY KEY("path")
);

CREATE TABLE "egg_repositories" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(1020) NOT NULL,
	"description" text,
	"git_repository" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "egg_repositories_name_idx" ON "egg_repositories" USING btree ("name");
CREATE UNIQUE INDEX "egg_repositories_git_repository_idx" ON "egg_repositories" USING btree ("git_repository");