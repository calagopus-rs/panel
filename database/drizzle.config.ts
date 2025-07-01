import { defineConfig } from "drizzle-kit"
import { filesystem } from "@rjweb/utils"

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/schema.ts',
	out: './migrations',
	breakpoints: false,
	dbCredentials: {
		url: filesystem.env('../.env', { async: false }).DATABASE_URL_PRIMARY ?? filesystem.env('../.env', { async: false }).DATABASE_URL
	}
})