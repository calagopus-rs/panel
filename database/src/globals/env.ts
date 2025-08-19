import { filesystem } from "@rjweb/utils"
import { z } from "zod"

let env: Record<string, string | undefined>
try {
	env = filesystem.env('../.env', { async: false })
} catch {
	try {
		env = filesystem.env('../../.env', { async: false })
	} catch {
		try {
			env = filesystem.env('../../../.env', { async: false })
		} catch {
			env = process.env
		}
	}
}

const infos = z.object({
	DATABASE_URL: z.string(),

	LOG_DIRECTORY: z.string().optional(),
})

export type Environment = z.infer<typeof infos>

export default infos.parse(env)
