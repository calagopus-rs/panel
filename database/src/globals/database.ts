import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "@/schema"
import env from "@/globals/env"
import logger from "@/globals/logger"
import { Pool } from "pg"

const pool = new Pool({
	connectionString: env.DATABASE_URL
})

const db = drizzle(pool, { schema }),
	startTime = performance.now()

db.$client.connect().then(() => {
	logger()
		.text('Database', (c) => c.cyan)
		.text('Connection established!')
		.text(`(${(performance.now() - startTime).toFixed(1)}ms)`, (c) => c.gray)
		.info()
})

export default Object.assign(db, {
	schema
})
