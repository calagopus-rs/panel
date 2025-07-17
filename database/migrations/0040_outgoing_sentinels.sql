CREATE TABLE "location_database_hosts" (
	"location_id" integer NOT NULL,
	"database_host_id" integer NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "location_database_hosts_pk" PRIMARY KEY("location_id","database_host_id")
);

ALTER TABLE "location_database_hosts" ADD CONSTRAINT "location_database_hosts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "location_database_hosts" ADD CONSTRAINT "location_database_hosts_database_host_id_database_hosts_id_fk" FOREIGN KEY ("database_host_id") REFERENCES "public"."database_hosts"("id") ON DELETE cascade ON UPDATE no action;