import {
	BuildExtraConfigColumns,
	ColumnBaseConfig,
	ColumnDataType,
} from "drizzle-orm";
import {
	customType,
	PgColumn,
	PgColumnBuilderBase,
	pgEnum,
	PgEnum,
	PgTable,
	pgTable,
	PgTableExtraConfigValue,
} from "drizzle-orm/pg-core";

export const UTF8_MAX_SCALAR_SIZE = 4;

export const bytea = customType<{
	data: string;
	notNull: false;
	default: false;
}>({
	dataType() {
		return "bytea";
	},

	toDriver(val: string) {
		let newVal = val;
		if (val.startsWith("0x")) {
			newVal = val.slice(2);
		}

		return Buffer.from(newVal, "hex");
	},

	fromDriver(val: unknown) {
		return (val as Buffer).toString("hex");
	},
});

export const disallowedColumnNames = [
	"select",
	"from",
	"where",
	"join",
	"on",
	"group",
	"order",
	"by",
	"insert",
	"update",
	"delete",
	"create",
	"drop",
	"alter",
	"index",
	"table",
	"database",
	"schema",
	"and",
	"or",
	"not",
	"as",
	"null",
	"is",
	"in",
	"like",
	"between",
	"limit",
	"offset",
	"union",
	"all",
	"distinct",
];

export class DatabaseDefinitions {
	public enums: Record<string, DatabaseEnum> = {};
	public tables: Record<string, DatabaseTable> = {};

	public table(name: string): DatabaseTable | undefined {
		for (const table of Object.values(this.tables)) {
			if (table.name === name) {
				return table;
			}
		}
		return undefined;
	}

	public addEnum(name: string, variants: string[]): DatabaseEnum {
		const enm = new DatabaseEnum(name, variants);
		this.enums[enm.name] = enm;
		return enm;
	}

	public addTable(
		name: string,
		callback: (table: DatabaseTable) => DatabaseTable,
	): DatabaseTable {
		const table = callback(new DatabaseTable(name));
		this.tables[table.name] = table;
		return table;
	}

	public modifyTable(
		name: string,
		callback: (table: DatabaseTable) => unknown,
	): void {
		const table = this.table(name);
		if (!table) {
			throw new Error(`Table "${name}" does not exist and cannot be modified.`);
		}
		callback(table);
	}

	public modifyTableIfExists(
		name: string,
		callback: (table: DatabaseTable) => unknown,
	): void {
		const table = this.table(name);
		if (!table) {
			return;
		}
		callback(table);
	}
}

export class DatabaseEnum {
	public readonly name: string;
	public variants: string[];

	constructor(name: string, variants: string[]) {
		this.name = name;
		this.variants = variants;
	}

	public addVariant(variant: string): this {
		this.variants.push(variant);
		return this;
	}

	public intoDrizzleEnum(): PgEnum<[string, ...string[]]> {
		if (this.variants.length < 1) {
			throw new Error(`Enum "${this.name}" must have at least one variant.`);
		}

		return pgEnum(this.name, this.variants as [string, ...string[]]);
	}
}

type ConfigCallback = (
	self: BuildExtraConfigColumns<
		string,
		Record<string, PgColumnBuilderBase>,
		"pg"
	>,
) => PgTableExtraConfigValue[];
export class DatabaseTable {
	public readonly name: string;
	public columns: Record<string, PgColumnBuilderBase> = {};
	public configBuilders: ConfigCallback[] = [];

	constructor(name: string) {
		this.name = name;
	}

	public addColumn(name: string, column: PgColumnBuilderBase): this {
		if (name.toLowerCase() !== name) {
			throw new Error(`Column name "${name}" must be in lowercase.`);
		} else if (disallowedColumnNames.includes(name.toLowerCase())) {
			throw new Error(
				`Column name "${name}" is disallowed as it is a reserved SQL keyword.`,
			);
		} else if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
			throw new Error(
				`Column name "${name}" contains invalid characters. Only lowercase letters, numbers, and underscores are allowed, and it cannot start with a number.`,
			);
		}

		this.columns[name] = column;
		return this;
	}

	public addConfigBuilder(config: ConfigCallback): this {
		this.configBuilders.push(config);
		return this;
	}

	// Returns a built table for use in joins
	public join(): Record<
		string,
		PgColumn<ColumnBaseConfig<ColumnDataType, string>, object, object>
	> {
		return pgTable(this.name, this.columns);
	}

	public intoDrizzleTable(): PgTable {
		return pgTable(this.name, this.columns, (self) => {
			const aggregatedConfig: PgTableExtraConfigValue[] = [];
			for (const builder of this.configBuilders) {
				aggregatedConfig.push(...builder(self));
			}

			return aggregatedConfig;
		});
	}
}
