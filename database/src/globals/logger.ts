import colors, { StyleFunction } from "ansi-colors"
import env from "@/globals/env"
import * as fs from "fs"
import path from "path"

type Colors = typeof import('ansi-colors')

export const logStream: Record<string, fs.WriteStream> = {}

if (env.LOG_DIRECTORY && !fs.existsSync(env.LOG_DIRECTORY)) {
	fs.mkdirSync(env.LOG_DIRECTORY, { recursive: true })
}

class Logger {
	protected content: any[] = []

	private logInStream(type: 'info' | 'error' | 'debug') {
		if (!env.LOG_DIRECTORY) return

		const logFile = `${new Date(Date.now() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().slice(0, 10)}.${type}.log`

		if (!logStream[logFile]) {
			logStream[logFile] = fs.createWriteStream(path.join(env.LOG_DIRECTORY, logFile), { flags: 'a' })

			if (fs.existsSync(path.join(env.LOG_DIRECTORY, `latest.${type}.log`))) {
				fs.unlinkSync(path.join(env.LOG_DIRECTORY, `latest.${type}.log`))
			}

			fs.symlinkSync(logFile, path.join(env.LOG_DIRECTORY, `latest.${type}.log`), 'file')

			if (Object.keys(logStream).length > 1) {
				for (const file in logStream) {
					if (file === logFile) continue

					logStream[file].end()
					delete logStream[file]
				}
			}
		}

		logStream[logFile].write(`[${new Date(Date.now() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString()}]: ${this.content.join(' ').replaceAll(colors.ansiRegex, '')}\n`)
	}

	/**
	 * Add Text
	 * @since 1.0.0
	*/ public text(text: string | number, color: (c: Colors) => StyleFunction = (c) => c.reset): this {
		this.content.push(color(colors)(text.toString()))

		return this
	}

	/**
	 * Add Raw Values
	 * @since 1.0.0
	*/ public raw(content: any): this {
		this.content.push(content)

		return this
	}


	/**
	 * Log as INF
	 * @since 1.0.0
	*/ public info(): boolean {
		console.info(colors.bgBlue(' INF '), colors.gray(new Date().toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})), ...this.content)

		this.logInStream('info')

		return true
	}

	/**
	 * Log as ERR
	 * @since 1.0.0
	*/ public error(): boolean {
		console.error(colors.bgRed(' ERR '), colors.gray(new Date().toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})), ...this.content)

		this.logInStream('error')

		return true
	}

	/**
	 * Log as DEB
	 * @since 1.0.0
	*/ public debug(): boolean {
		console.error(colors.bgYellow(' DEB '), colors.gray(new Date().toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})), ...this.content)

		this.logInStream('debug')

		return true
	}
}

export default function logger(): Logger {
	return new Logger()
}
