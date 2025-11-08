ALTER TABLE "oauth_providers" RENAME COLUMN "user_linkable" TO "user_manageable";
ALTER TABLE "oauth_providers" ADD COLUMN "link_viewable" boolean DEFAULT false NOT NULL;