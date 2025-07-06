import { sql } from "drizzle-orm"
import { index, integer, pgTable, varchar, uniqueIndex, pgEnum, serial, char, boolean, timestamp, text, uuid, smallint, jsonb, inet, bigint, primaryKey, PgColumn, customType } from "drizzle-orm/pg-core"

export const bytea = customType<{ data: string; notNull: false; default: false }>({
  dataType() {
    return 'bytea'
  },

  toDriver(val: string) {
    let newVal = val
    if (val.startsWith('0x')) {
      newVal = val.slice(2)
    }

    return Buffer.from(newVal, 'hex')
  },

  fromDriver(val: unknown) {
    return (val as Buffer).toString('hex')
  }
})

export const databaseTypeEnum = pgEnum('database_type', [
	'MARIADB',
	'POSTGRESQL'
])

export const serverStatusEnum = pgEnum('server_status', [
	'INSTALLING',
	'INSTALL_FAILED',
	'REINSTALL_FAILED',
	'RESTORING_BACKUP'
])

export const settings = pgTable('settings', {
	key: varchar('key', { length: 255 }).primaryKey().notNull(),
	value: text('value').notNull(),
}, (settings) => [
	uniqueIndex('settings_key_idx').on(settings.key)
])

export const users = pgTable('users', {
	id: serial('id').primaryKey().notNull(),
	externalId: varchar('external_id', { length: 255 }),

	avatar: varchar('avatar', { length: 255 }),
	username: varchar('username', { length: 15 }).notNull(),
	email: varchar('email', { length: 255 }).notNull(),

	nameFirst: varchar('name_first', { length: 255 }).notNull(),
	nameLast: varchar('name_last', { length: 255 }).notNull(),

	password: text('password').notNull(),

	admin: boolean('admin').default(false).notNull(),
	totp_enabled: boolean('totp_enabled').default(false).notNull(),
	totp_secret: char('totp_secret', { length: 32 }),

	created: timestamp('created').default(sql`now()`).notNull()
}, (users) => [
	index('users_external_id_idx').on(users.externalId),
	uniqueIndex('users_username_idx').on(users.username),
	uniqueIndex('users_email_idx').on(users.email)
])

export const userActivities = pgTable('user_activities', {
	id: serial('id').primaryKey().notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	apiKeyId: integer('api_key_id').references(() => userApiKeys.id, { onDelete: 'set null' }),

	event: varchar('event', { length: 255 }).notNull(),
	ip: inet('ip').notNull(),
	data: jsonb('data').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userActivities) => [
	index('user_activities_user_id_idx').on(userActivities.userId),
	index('user_activities_event_idx').on(userActivities.event)
])

export const userSessions = pgTable('user_sessions', {
	id: serial('id').primaryKey().notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

	key: text('key').notNull(),
	ip: inet('ip').notNull(),
	userAgent: varchar('user_agent', { length: 255 }).notNull(),

	lastUsed: timestamp('last_used').default(sql`now()`).notNull(),
	created: timestamp('created').default(sql`now()`).notNull()
}, (userSessions) => [
	index('user_sessions_user_id_idx').on(userSessions.userId),
	uniqueIndex('user_sessions_key_idx').on(userSessions.key)
])

export const userRecoveryCodes = pgTable('user_recovery_codes', {
	id: serial('id').primaryKey().notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

	code: text('code').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userRecoveryCodes) => [
	index('user_recovery_codes_user_id_idx').on(userRecoveryCodes.userId),
	uniqueIndex('user_recovery_codes_user_id_code_idx').on(userRecoveryCodes.userId, userRecoveryCodes.code)
])

export const userPasswordResets = pgTable('user_password_resets', {
	id: serial('id').primaryKey().notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

	token: text('token').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userPasswordResets) => [
	index('user_password_resets_user_id_idx').on(userPasswordResets.userId),
	uniqueIndex('user_password_resets_token_idx').on(userPasswordResets.token)
])

export const userSshKeys = pgTable('user_ssh_keys', {
	id: serial('id').primaryKey().notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 31 }).notNull(),
	fingerprint: char('fingerprint', { length: 50 }).notNull(),

	public_key: bytea('public_key').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userSshKeys) => [
	index('user_ssh_keys_user_id_idx').on(userSshKeys.userId),
	uniqueIndex('user_ssh_keys_user_id_name_idx').on(userSshKeys.userId, userSshKeys.name),
	uniqueIndex('user_ssh_keys_user_id_fingerprint_idx').on(userSshKeys.userId, userSshKeys.fingerprint)
])

export const userApiKeys = pgTable('user_api_keys', {
	id: serial('id').primaryKey().notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 31 }).notNull(),
	keyStart: char('key_start', { length: 16 }).notNull(),
	key: text('key').notNull(),
	permissions: varchar('permissions', { length: 32 }).array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull(),
	lastUsed: timestamp('last_used')
}, (userApiKeys) => [
	index('user_api_keys_user_id_idx').on(userApiKeys.userId),
	uniqueIndex('user_api_keys_user_id_name_idx').on(userApiKeys.userId, userApiKeys.name),
	uniqueIndex('user_api_keys_user_id_key_start_idx').on(userApiKeys.userId, userApiKeys.keyStart),
	uniqueIndex('user_api_keys_key_idx').on(userApiKeys.key)
])

export const mounts = pgTable('mounts', {
	id: serial('id').primaryKey().notNull(),

	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),

	source: varchar('source', { length: 255 }).notNull(),
	target: varchar('target', { length: 255 }).notNull(),

	readOnly: boolean('read_only').default(false).notNull(),
	userMountable: boolean('user_mountable').default(false).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (mounts) => [
	uniqueIndex('mounts_source_target_idx').on(mounts.source, mounts.target)
])

export const locations = pgTable('locations', {
	id: serial('id').primaryKey().notNull(),

	shortName: varchar('short_name', { length: 31 }).notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),

	config_backups: jsonb('config_backups').default({ type: 'local' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (locations) => [
	uniqueIndex('locations_short_idx').on(locations.shortName),
	uniqueIndex('locations_name_idx').on(locations.name)
])

export const nodes = pgTable('nodes', {
	id: serial('id').primaryKey().notNull(),
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).notNull(),
	locationId: integer('location_id').references(() => locations.id).notNull(),

	name: varchar('name', { length: 255 }).notNull(),
	public: boolean('public').notNull(),
	description: text('description'),

	publicUrl: varchar('public_url', { length: 255 }),
	url: varchar('url', { length: 255 }).notNull(),
	sftpHost: varchar('sftp_host', { length: 255 }),
	sftpPort: integer('sftp_port').notNull(),

	maintenanceMessage: text('maintenance_message'),

	memory: bigint('memory', { mode: 'number' }).notNull(),
	disk: bigint('disk', { mode: 'number' }).notNull(),

	tokenId: char('token_id', { length: 16 }).notNull(),
	token: bytea('token').notNull(),

	created: timestamp('created').default(sql`now()`).notNull(),
}, (nodes) => [
	uniqueIndex('nodes_uuid_idx').on(nodes.uuid),
	uniqueIndex('nodes_name_idx').on(nodes.name),
	uniqueIndex('nodes_token_id_idx').on(nodes.tokenId),
	uniqueIndex('nodes_token_idx').on(nodes.token),
])

export const nodeMounts = pgTable('node_mounts', {
	nodeId: integer('node_id').references(() => nodes.id, { onDelete: 'cascade' }).notNull(),
	mountId: integer('mount_id').references(() => mounts.id, { onDelete: 'cascade' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (nodeMounts) => [
	primaryKey({ name: 'node_mounts_pk', columns: [nodeMounts.nodeId, nodeMounts.mountId] }),

	index('node_mounts_node_id_idx').on(nodeMounts.nodeId),
	index('node_mounts_mount_id_idx').on(nodeMounts.mountId)
])

export const nodeAllocations = pgTable('node_allocations', {
	id: serial('id').primaryKey().notNull(),
	nodeId: integer('node_id').references(() => nodes.id).notNull(),

	ip: inet('ip').notNull(),
	ipAlias: varchar('ip_alias', { length: 255 }),
	port: integer('port').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (allocations) => [
	index('allocations_node_id_idx').on(allocations.nodeId),
	uniqueIndex('allocations_node_id_ip_port_idx').on(allocations.nodeId, allocations.ip, allocations.port)
])

export const nests = pgTable('nests', {
	id: serial('id').primaryKey().notNull(),
	
	author: varchar('author', { length: 255 }).notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),

	created: timestamp('created').default(sql`now()`).notNull()
}, (nests) => [
	uniqueIndex('nests_name_idx').on(nests.name)
])

export const nestEggs = pgTable('nest_eggs', {
	id: serial('id').primaryKey().notNull(),
	nestId: integer('nest_id').references(() => nests.id).notNull(),

	author: varchar('author', { length: 255 }).notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),

	config_files: jsonb('config_files').notNull(),
	config_startup: jsonb('config_startup').notNull(),
	config_stop: jsonb('config_stop').notNull(),
	config_script: jsonb('config_script').notNull(),

	startup: varchar('startup', { length: 255 }).notNull(),
	forceOutgoingIp: boolean('force_outgoing_ip').default(false).notNull(),

	features: varchar('features', { length: 255 }).array().notNull(),
	docker_images: jsonb('docker_images').$type<Record<string, string>>().notNull(),
	file_denylist: varchar('file_denylist', { length: 255 }).array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (eggs) => [
	index('eggs_nest_id_idx').on(eggs.nestId)
])

export const nestEggMounts = pgTable('nest_egg_mounts', {
	eggId: integer('egg_id').references(() => nestEggs.id, { onDelete: 'cascade' }).notNull(),
	mountId: integer('mount_id').references(() => mounts.id, { onDelete: 'cascade' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (eggMounts) => [
	primaryKey({ name: 'egg_mounts_pk', columns: [eggMounts.eggId, eggMounts.mountId] }),

	index('egg_mounts_egg_id_idx').on(eggMounts.eggId),
	index('egg_mounts_mount_id_idx').on(eggMounts.mountId)
])

export const nestEggVariables = pgTable('nest_egg_variables', {
	id: serial('id').primaryKey().notNull(),
	eggId: integer('egg_id').references(() => nestEggs.id, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),

	envVariable: varchar('env_variable', { length: 255 }).notNull(),
	defaultValue: text('default_value'),
	userViewable: boolean('user_viewable').default(true).notNull(),
	userEditable: boolean('user_editable').default(false).notNull(),
	rules: varchar('rules', { length: 255 }).array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (eggVariables) => [
	index('egg_variables_egg_id_idx').on(eggVariables.eggId),
	uniqueIndex('egg_variables_egg_id_name_idx').on(eggVariables.eggId, eggVariables.name)
])

export const databaseHosts = pgTable('database_hosts', {
	id: serial('id').primaryKey().notNull(),

	name: varchar('name', { length: 255 }).notNull(),
	type: databaseTypeEnum('type').notNull(),

	publicHost: varchar('public_host', { length: 255 }),
	host: varchar('host', { length: 255 }).notNull(),
	publicPort: integer('public_port'),
	port: integer('port').notNull(),

	username: varchar('username', { length: 255 }).notNull(),
	password: bytea('password').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (databaseHosts) => [
	uniqueIndex('database_hosts_name_idx').on(databaseHosts.name),
	uniqueIndex('database_hosts_host_port_idx').on(databaseHosts.host, databaseHosts.port)
])

export const servers = pgTable('servers', {
	id: serial('id').primaryKey().notNull(),
	uuid: uuid('uuid').notNull(),
	uuidShort: integer('uuid_short').notNull(),
	externalId: varchar('external_id', { length: 255 }),
	allocationId: integer('allocation_id').references((): PgColumn => serverAllocations.id, { onDelete: 'set null' }),
	nodeId: integer('node_id').references(() => nodes.id).notNull(),
	ownerId: integer('owner_id').references(() => users.id).notNull(),
	eggId: integer('egg_id').references(() => nestEggs.id).notNull(),

	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),

	status: serverStatusEnum('status'),
	suspended: boolean('suspended').default(false).notNull(),

	memory: bigint('memory', { mode: 'number' }).notNull(),
	swap: bigint('swap', { mode: 'number' }).notNull(),
	disk: bigint('disk', { mode: 'number' }).notNull(),
	io: integer('io').notNull(),
	cpu: integer('cpu').notNull(),
	pinned_cpus: smallint('pinned_cpus').array().notNull(),

	startup: varchar('startup', { length: 255 }).notNull(),
	image: varchar('image', { length: 255 }).notNull(),

	allocationLimit: integer('allocation_limit').notNull(),
	databaseLimit: integer('database_limit').notNull(),
	backupLimit: integer('backup_limit').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (servers) => [
	index('servers_node_id_idx').on(servers.nodeId),
	uniqueIndex('servers_uuid_idx').on(servers.uuid),
	uniqueIndex('servers_uuid_short_idx').on(servers.uuidShort),
	index('servers_external_id_idx').on(servers.externalId),
	index('servers_owner_id_idx').on(servers.ownerId),
])

export const serverAllocations = pgTable('server_allocations', {
	id: serial('id').primaryKey().notNull(),
	serverId: integer('server_id').references(() => servers.id, { onDelete: 'cascade' }).notNull(),
	allocationId: integer('allocation_id').references(() => nodeAllocations.id, { onDelete: 'cascade' }).notNull(),

	notes: text('notes'),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverAllocations) => [
	index('server_allocations_server_id_idx').on(serverAllocations.serverId),
	uniqueIndex('server_allocations_allocation_id_idx').on(serverAllocations.allocationId)
])

export const serverSubusers = pgTable('server_subusers', {
	serverId: integer('server_id').references(() => servers.id, { onDelete: 'cascade' }).notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

	permissions: varchar('permissions', { length: 32 }).array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverSubusers) => [
	primaryKey({ name: 'server_subusers_pk', columns: [serverSubusers.serverId, serverSubusers.userId] }),

	index('server_subusers_server_id_idx').on(serverSubusers.serverId),
	index('server_subusers_user_id_idx').on(serverSubusers.userId)
])

export const serverActivities = pgTable('server_activities', {
	id: serial('id').primaryKey().notNull(),
	serverId: integer('server_id').references(() => servers.id, { onDelete: 'cascade' }).notNull(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
	apiKeyId: integer('api_key_id').references(() => userApiKeys.id, { onDelete: 'set null' }),

	event: varchar('event', { length: 255 }).notNull(),
	ip: inet('ip').notNull(),
	data: jsonb('data').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverActivities) => [
	index('server_activities_server_id_idx').on(serverActivities.serverId),
	index('server_activities_user_id_idx').on(serverActivities.userId),
	index('server_activities_server_id_event_idx').on(serverActivities.serverId, serverActivities.event),
	index('server_activities_user_id_event_idx').on(serverActivities.userId, serverActivities.event)
])

export const serverVariables = pgTable('server_variables', {
	serverId: integer('server_id').references(() => servers.id, { onDelete: 'cascade' }).notNull(),
	variableId: integer('variable_id').references(() => nestEggVariables.id, { onDelete: 'cascade' }).notNull(),

	value: text('value').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverVariables) => [
	primaryKey({ name: 'server_variables_pk', columns: [serverVariables.serverId, serverVariables.variableId] }),

	index('server_variables_server_id_idx').on(serverVariables.serverId),
	index('server_variables_variable_id_idx').on(serverVariables.variableId)
])

export const serverMounts = pgTable('server_mounts', {
	serverId: integer('server_id').references(() => servers.id, { onDelete: 'cascade' }).notNull(),
	mountId: integer('mount_id').references(() => mounts.id, { onDelete: 'cascade' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverMounts) => [
	primaryKey({ name: 'server_mounts_pk', columns: [serverMounts.serverId, serverMounts.mountId] }),

	index('server_mounts_server_id_idx').on(serverMounts.serverId),
	index('server_mounts_mount_id_idx').on(serverMounts.mountId)
])

export const serverBackups = pgTable('server_backups', {
	id: serial('id').primaryKey().notNull(),
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).notNull(),
	serverId: integer('server_id').references(() => servers.id, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 255 }).notNull(),
	successful: boolean('successful').default(false).notNull(),
	locked: boolean('locked').default(false).notNull(),

	ignoredFiles: varchar('ignored_files', { length: 255 }).array().notNull(),
	checksum: varchar('checksum', { length: 255 }).notNull(),
	bytes: bigint('bytes', { mode: 'number' }).notNull(),
	disk: varchar('disk', { length: 31 }).notNull(),

	completed: timestamp('completed'),
	deleted: timestamp('deleted'),
	created: timestamp('created').default(sql`now()`).notNull()
}, (serverBackups) => [
	index('server_backups_server_id_idx').on(serverBackups.serverId),
	uniqueIndex('server_backups_uuid_idx').on(serverBackups.uuid)
])

export const serverDatabases = pgTable('server_databases', {
	id: serial('id').primaryKey().notNull(),
	serverId: integer('server_id').references(() => servers.id).notNull(),
	databaseHostId: integer('database_host_id').references(() => databaseHosts.id).notNull(),

	name: varchar('name', { length: 31 }).notNull(),
	username: varchar('username', { length: 31 }).notNull(),
	password: bytea('password').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverDatabases) => [
	index('server_databases_server_id_idx').on(serverDatabases.serverId),
	uniqueIndex('server_databases_server_id_database_idx').on(serverDatabases.serverId, serverDatabases.name)
])