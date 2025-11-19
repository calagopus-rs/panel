import { sql } from "drizzle-orm"
import { index, integer, pgTable, varchar, uniqueIndex, pgEnum, char, boolean, timestamp, text, uuid, smallint, jsonb, inet, bigint, primaryKey, PgColumn, customType, json } from "drizzle-orm/pg-core"

const UTF8_MAX_SCALAR_SIZE = 4

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
	'MYSQL',
	'POSTGRES'
])

export const serverStatusEnum = pgEnum('server_status', [
	'INSTALLING',
	'INSTALL_FAILED',
	'RESTORING_BACKUP'
])

export const backupDiskEnum = pgEnum('backup_disk', [
	'LOCAL',
	'S3',
	'DDUP_BAK',
	'BTRFS',
	'ZFS',
	'RESTIC'
])

export const settings = pgTable('settings', {
	key: varchar('key', { length: 255 }).primaryKey().notNull(),
	value: text('value').notNull(),
}, (settings) => [
	uniqueIndex('settings_key_idx').on(settings.key)
])

export const adminActivities = pgTable('admin_activities', {
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'set null' }),
	apiKeyUuid: uuid('api_key_uuid').references(() => userApiKeys.uuid, { onDelete: 'set null' }),

	event: varchar('event', { length: 255 }).notNull(),
	ip: inet('ip'),
	data: jsonb('data').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (adminActivities) => [
	index('admin_activities_user_uuid_idx').on(adminActivities.userUuid),
	index('admin_activities_event_idx').on(adminActivities.event),
	index('admin_activities_user_uuid_event_idx').on(adminActivities.userUuid, adminActivities.event)
])

export const users = pgTable('users', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	roleUuid: uuid('role_uuid').references(() => roles.uuid, { onDelete: 'set null' }),
	externalId: varchar('external_id', { length: 255 }),

	avatar: varchar('avatar', { length: 255 }),
	username: varchar('username', { length: 15 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	email: varchar('email', { length: 255 }).notNull(),

	nameFirst: varchar('name_first', { length: 255 }).notNull(),
	nameLast: varchar('name_last', { length: 255 }).notNull(),

	password: text('password').notNull(),

	admin: boolean('admin').default(false).notNull(),
	totp_enabled: boolean('totp_enabled').default(false).notNull(),
	totp_secret: char('totp_secret', { length: 32 }),

	created: timestamp('created').default(sql`now()`).notNull()
}, (users) => [
	uniqueIndex('users_external_id_idx').on(users.externalId),
	uniqueIndex('users_username_idx').on(sql`lower(${users.username})`),
	uniqueIndex('users_email_idx').on(sql`lower(${users.email})`)
])

export const userActivities = pgTable('user_activities', {
	userId: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),
	apiKeyUuid: uuid('api_key_uuid').references(() => userApiKeys.uuid, { onDelete: 'set null' }),

	event: varchar('event', { length: 255 }).notNull(),
	ip: inet('ip'),
	data: jsonb('data').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userActivities) => [
	index('user_activities_user_id_idx').on(userActivities.userId),
	index('user_activities_user_id_event_idx').on(userActivities.userId, userActivities.event)
])

export const userSessions = pgTable('user_sessions', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	key_id: char('key_id', { length: 16 }).notNull(),
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
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	code: char('code', { length: 10 }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userRecoveryCodes) => [
	primaryKey({ name: 'user_recovery_codes_user_uuid_code_idx', columns: [userRecoveryCodes.userUuid, userRecoveryCodes.code] }),

	index('user_recovery_codes_user_uuid_idx').on(userRecoveryCodes.userUuid)
])

export const userPasswordResets = pgTable('user_password_resets', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	token: text('token').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userPasswordResets) => [
	index('user_password_resets_user_uuid_idx').on(userPasswordResets.userUuid),
	uniqueIndex('user_password_resets_token_idx').on(userPasswordResets.token)
])

export const userSecurityKeys = pgTable('user_security_keys', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull(),

	credentialId: bytea('credential_id').notNull(),
	passkey: jsonb('passkey'),
	registration: jsonb('registration'),

	created: timestamp('created').default(sql`now()`).notNull(),
	lastUsed: timestamp('last_used')
}, (userSecurityKeys) => [
	index('user_security_keys_user_uuid_idx').on(userSecurityKeys.userUuid),
	uniqueIndex('user_security_keys_user_uuid_name_idx').on(userSecurityKeys.userUuid, userSecurityKeys.name),
	uniqueIndex('user_security_keys_user_uuid_credential_id_idx').on(userSecurityKeys.userUuid, userSecurityKeys.credentialId)
])

export const userSshKeys = pgTable('user_ssh_keys', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	fingerprint: char('fingerprint', { length: 50 }).notNull(),

	publicKey: bytea('public_key').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (userSshKeys) => [
	index('user_ssh_keys_user_uuid_idx').on(userSshKeys.userUuid),
	uniqueIndex('user_ssh_keys_user_uuid_name_idx').on(userSshKeys.userUuid, userSshKeys.name),
	uniqueIndex('user_ssh_keys_user_uuid_fingerprint_idx').on(userSshKeys.userUuid, userSshKeys.fingerprint)
])

export const userApiKeys = pgTable('user_api_keys', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	keyStart: char('key_start', { length: 16 }).notNull(),
	key: text('key').notNull(),

	user_permissions: varchar('user_permissions', { length: 64 }).array().notNull(),
	admin_permissions: varchar('admin_permissions', { length: 64 }).array().notNull(),
	server_permissions: varchar('server_permissions', { length: 64 }).array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull(),
	lastUsed: timestamp('last_used')
}, (userApiKeys) => [
	index('user_api_keys_user_uuid_idx').on(userApiKeys.userUuid),
	uniqueIndex('user_api_keys_user_uuid_name_idx').on(userApiKeys.userUuid, userApiKeys.name),
	uniqueIndex('user_api_keys_user_uuid_key_start_idx').on(userApiKeys.userUuid, userApiKeys.keyStart),
	uniqueIndex('user_api_keys_key_idx').on(userApiKeys.key)
])

export const userOauthLinks = pgTable('user_oauth_links', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),
	oauthProviderUuid: uuid('oauth_provider_uuid').references(() => oauthProviders.uuid, { onDelete: 'cascade' }).notNull(),

	identifier: varchar('identifier', { length: 255 }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull(),
	lastUsed: timestamp('last_used')
}, (userOauthLinks) => [
	index('user_oauth_links_user_uuid_idx').on(userOauthLinks.userUuid),
	index('user_oauth_links_oauth_provider_uuid_idx').on(userOauthLinks.oauthProviderUuid),
	uniqueIndex('user_oauth_links_user_uuid_oauth_provider_uuid_idx').on(userOauthLinks.userUuid, userOauthLinks.oauthProviderUuid),
	uniqueIndex('user_oauth_links_oauth_provider_uuid_identifier_idx').on(userOauthLinks.oauthProviderUuid, userOauthLinks.identifier)
])

export const userServerGroups = pgTable('user_server_groups', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	order: smallint('order_').default(0).notNull(),

	serverOrder: uuid('server_order').array().default([]).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverGroups) => [
	index('server_groups_user_uuid_idx').on(serverGroups.userUuid)
])

export const roles = pgTable('roles', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	admin_permissions: varchar('admin_permissions', { length: 64 }).array().notNull(),
	server_permissions: varchar('server_permissions', { length: 64 }).array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (roles) => [
	uniqueIndex('roles_name_idx').on(roles.name)
])

export const oauthProviders = pgTable('oauth_providers', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	clientId: varchar('client_id', { length: 255 }).notNull(),
	clientSecret: bytea('client_secret').notNull(),
	authUrl: varchar('auth_url', { length: 255 }).notNull(),
	tokenUrl: varchar('token_url', { length: 255 }).notNull(),
	infoUrl: varchar('info_url', { length: 64 }).notNull(),
	scopes: varchar('scopes', { length: 64 }).array().notNull(),

	identifierPath: varchar('identifier_path', { length: 255 }).notNull(),
	emailPath: varchar('email_path', { length: 255 }),
	usernamePath: varchar('username_path', { length: 255 }),
	nameFirstPath: varchar('name_first_path', { length: 255 }),
	nameLastPath: varchar('name_last_path', { length: 255 }),

	enabled: boolean('enabled').default(false).notNull(),
	loginOnly: boolean('login_only').default(false).notNull(),
	linkViewable: boolean('link_viewable').default(false).notNull(),
	userManageable: boolean('user_manageable').default(false).notNull(),
	basicAuth: boolean('basic_auth').default(false).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (oauthProviders) => [
	uniqueIndex('oauth_providers_name_idx').on(oauthProviders.name)
])

export const mounts = pgTable('mounts', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	source: varchar('source', { length: 255 }).notNull(),
	target: varchar('target', { length: 255 }).notNull(),

	readOnly: boolean('read_only').default(false).notNull(),
	userMountable: boolean('user_mountable').default(false).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (mounts) => [
	uniqueIndex('mounts_name_idx').on(mounts.name),
	uniqueIndex('mounts_source_target_idx').on(mounts.source, mounts.target)
])

export const backupConfigurations = pgTable('backup_configurations', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	backupDisk: backupDiskEnum('backup_disk').default('LOCAL').notNull(),
	backupConfigs: jsonb('backup_configs').default({}).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (backupConfigurations) => [
	uniqueIndex('backup_configurations_name_idx').on(backupConfigurations.name)
])

export const locations = pgTable('locations', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	backupConfigurationUuid: uuid('backup_configuration_uuid').references(() => backupConfigurations.uuid, { onDelete: 'set null' }),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	created: timestamp('created').default(sql`now()`).notNull()
}, (locations) => [
	index('locations_backup_configuration_uuid_idx').on(locations.backupConfigurationUuid),
	uniqueIndex('locations_name_idx').on(locations.name)
])

export const locationDatabaseHosts = pgTable('location_database_hosts', {
	locationUuid: uuid('location_uuid').references(() => locations.uuid, { onDelete: 'cascade' }).notNull(),
	databaseHostUuid: uuid('database_host_uuid').references(() => databaseHosts.uuid, { onDelete: 'cascade' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (locationDatabaseHosts) => [
	primaryKey({ name: 'location_database_hosts_pk', columns: [locationDatabaseHosts.locationUuid, locationDatabaseHosts.databaseHostUuid] }),

	index('location_database_hosts_location_uuid_idx').on(locationDatabaseHosts.locationUuid),
	index('location_database_hosts_database_host_uuid_idx').on(locationDatabaseHosts.databaseHostUuid)
])

export const nodes = pgTable('nodes', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	locationUuid: uuid('location_uuid').references(() => locations.uuid).notNull(),
	backupConfigurationUuid: uuid('backup_configuration_uuid').references(() => backupConfigurations.uuid, { onDelete: 'set null' }),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	public: boolean('public').notNull(),
	description: text('description'),

	publicUrl: varchar('public_url', { length: 255 * UTF8_MAX_SCALAR_SIZE }),
	url: varchar('url', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	sftpHost: varchar('sftp_host', { length: 255 * UTF8_MAX_SCALAR_SIZE }),
	sftpPort: integer('sftp_port').notNull(),

	maintenanceMessage: text('maintenance_message'),

	memory: bigint('memory', { mode: 'number' }).notNull(),
	disk: bigint('disk', { mode: 'number' }).notNull(),

	tokenId: char('token_id', { length: 16 }).notNull(),
	token: bytea('token').notNull(),

	created: timestamp('created').default(sql`now()`).notNull(),
}, (nodes) => [
	index('nodes_location_uuid_idx').on(nodes.locationUuid),
	index('nodes_backup_configuration_uuid_idx').on(nodes.backupConfigurationUuid),
	uniqueIndex('nodes_uuid_idx').on(nodes.uuid),
	uniqueIndex('nodes_name_idx').on(nodes.name),
	uniqueIndex('nodes_token_id_idx').on(nodes.tokenId),
	uniqueIndex('nodes_token_idx').on(nodes.token),
])

export const nodeMounts = pgTable('node_mounts', {
	nodeUuid: uuid('node_uuid').references(() => nodes.uuid, { onDelete: 'cascade' }).notNull(),
	mountUuid: uuid('mount_uuid').references(() => mounts.uuid, { onDelete: 'cascade' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (nodeMounts) => [
	primaryKey({ name: 'node_mounts_pk', columns: [nodeMounts.nodeUuid, nodeMounts.mountUuid] }),

	index('node_mounts_node_uuid_idx').on(nodeMounts.nodeUuid),
	index('node_mounts_mount_uuid_idx').on(nodeMounts.mountUuid)
])

export const nodeAllocations = pgTable('node_allocations', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	nodeUuid: uuid('node_uuid').references(() => nodes.uuid, { onDelete: 'cascade' }).notNull(),

	ip: inet('ip').notNull(),
	ipAlias: varchar('ip_alias', { length: 255 }),
	port: integer('port').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (allocations) => [
	index('allocations_node_uuid_idx').on(allocations.nodeUuid),
	uniqueIndex('allocations_node_uuid_ip_port_idx').on(allocations.nodeUuid, sql`host(${allocations.ip})`, allocations.port)
])

export const nests = pgTable('nests', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),

	author: varchar('author', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	created: timestamp('created').default(sql`now()`).notNull()
}, (nests) => [
	uniqueIndex('nests_name_idx').on(nests.name)
])

export const nestEggs = pgTable('nest_eggs', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	nestUuid: uuid('nest_uuid').references(() => nests.uuid).notNull(),

	author: varchar('author', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	configFiles: jsonb('config_files').notNull(),
	configStartup: jsonb('config_startup').notNull(),
	configStop: jsonb('config_stop').notNull(),
	configScript: jsonb('config_script').notNull(),
	configAllocations: jsonb('config_allocations').default({}).notNull(),

	startup: text('startup').notNull(),
	forceOutgoingIp: boolean('force_outgoing_ip').default(false).notNull(),
	separatePort: boolean('separate_port').default(false).notNull(),

	features: text('features').array().notNull(),
	dockerImages: json('docker_images').$type<Record<string, string>>().notNull(),
	fileDenylist: text('file_denylist').array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (eggs) => [
	index('eggs_nest_uuid_idx').on(eggs.nestUuid),
	uniqueIndex('eggs_nest_uuid_name_idx').on(eggs.nestUuid, eggs.name),
])

export const nestEggMounts = pgTable('nest_egg_mounts', {
	eggUuid: uuid('egg_uuid').references(() => nestEggs.uuid, { onDelete: 'cascade' }).notNull(),
	mountUuid: uuid('mount_uuid').references(() => mounts.uuid, { onDelete: 'cascade' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (eggMounts) => [
	primaryKey({ name: 'egg_mounts_pk', columns: [eggMounts.eggUuid, eggMounts.mountUuid] }),

	index('egg_mounts_egg_uuid_idx').on(eggMounts.eggUuid),
	index('egg_mounts_mount_uuid_idx').on(eggMounts.mountUuid)
])

export const nestEggVariables = pgTable('nest_egg_variables', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	eggUuid: uuid('egg_uuid').references(() => nestEggs.uuid, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),
	order: smallint('order_').default(0).notNull(),

	envVariable: varchar('env_variable', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	defaultValue: text('default_value'),
	userViewable: boolean('user_viewable').default(true).notNull(),
	userEditable: boolean('user_editable').default(false).notNull(),
	rules: text('rules').array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (eggVariables) => [
	index('egg_variables_egg_uuid_idx').on(eggVariables.eggUuid),
	uniqueIndex('egg_variables_egg_uuid_name_idx').on(eggVariables.eggUuid, eggVariables.name),
	uniqueIndex('egg_variables_egg_uuid_env_variable_idx').on(eggVariables.eggUuid, eggVariables.envVariable)
])

export const databaseHosts = pgTable('database_hosts', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	public: boolean('public').default(false).notNull(),
	type: databaseTypeEnum('type').notNull(),

	publicHost: varchar('public_host', { length: 255 * UTF8_MAX_SCALAR_SIZE }),
	host: varchar('host', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	publicPort: integer('public_port'),
	port: integer('port').notNull(),

	username: varchar('username', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	password: bytea('password').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (databaseHosts) => [
	uniqueIndex('database_hosts_name_idx').on(databaseHosts.name),
	uniqueIndex('database_hosts_host_port_idx').on(databaseHosts.host, databaseHosts.port)
])

export const servers = pgTable('servers', {
	uuid: uuid('uuid').primaryKey().notNull(),
	uuidShort: integer('uuid_short').notNull(),
	externalId: varchar('external_id', { length: 255 * UTF8_MAX_SCALAR_SIZE }),
	allocationUuid: uuid('allocation_uuid').references((): PgColumn => serverAllocations.uuid, { onDelete: 'set null' }),
	destinationAllocationUuid: uuid('destination_allocation_uuid').references((): PgColumn => serverAllocations.uuid, { onDelete: 'set null' }),
	nodeUuid: uuid('node_uuid').references(() => nodes.uuid).notNull(),
	destinationNodeUuid: uuid('destination_node_uuid').references(() => nodes.uuid),
	ownerUuid: uuid('owner_uuid').references(() => users.uuid).notNull(),
	eggUuid: uuid('egg_uuid').references(() => nestEggs.uuid).notNull(),
	backupConfigurationUuid: uuid('backup_configuration_uuid').references(() => backupConfigurations.uuid, { onDelete: 'set null' }),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	description: text('description'),

	status: serverStatusEnum('status'),
	suspended: boolean('suspended').default(false).notNull(),

	memory: bigint('memory', { mode: 'number' }).notNull(),
	swap: bigint('swap', { mode: 'number' }).notNull(),
	disk: bigint('disk', { mode: 'number' }).notNull(),
	ioWeight: smallint('io_weight'),
	cpu: integer('cpu').notNull(),
	pinnedCpus: smallint('pinned_cpus').array().notNull(),

	startup: text('startup').notNull(),
	image: varchar('image', { length: 255 }).notNull(),
	autoKill: jsonb('auto_kill').default({ enabled: false, seconds: 30 }).notNull(),
	timezone: varchar('timezone', { length: 255 }),

	allocationLimit: integer('allocation_limit').default(0).notNull(),
	databaseLimit: integer('database_limit').default(0).notNull(),
	backupLimit: integer('backup_limit').default(0).notNull(),
	scheduleLimit: integer('schedule_limit').default(0).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (servers) => [
	index('servers_external_id_idx').on(servers.externalId),
	index('servers_allocation_uuid_idx').on(servers.allocationUuid),
	index('servers_node_uuid_idx').on(servers.nodeUuid),
	index('servers_owner_uuid_idx').on(servers.ownerUuid),
	index('servers_egg_uuid_idx').on(servers.eggUuid),
	index('servers_backup_configuration_uuid_idx').on(servers.backupConfigurationUuid),
	uniqueIndex('servers_uuid_short_idx').on(servers.uuidShort)
])

export const serverAllocations = pgTable('server_allocations', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	serverUuid: uuid('server_uuid').references(() => servers.uuid, { onDelete: 'cascade' }).notNull(),
	allocationUuid: uuid('allocation_uuid').references(() => nodeAllocations.uuid, { onDelete: 'cascade' }).notNull(),

	notes: text('notes'),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverAllocations) => [
	index('server_allocations_server_uuid_idx').on(serverAllocations.serverUuid),
	uniqueIndex('server_allocations_allocation_uuid_idx').on(serverAllocations.allocationUuid)
])

export const serverSubusers = pgTable('server_subusers', {
	serverUuid: uuid('server_uuid').references(() => servers.uuid, { onDelete: 'cascade' }).notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),

	permissions: varchar('permissions', { length: 32 }).array().notNull(),
	ignoredFiles: text('ignored_files').array().notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverSubusers) => [
	primaryKey({ name: 'server_subusers_pk', columns: [serverSubusers.serverUuid, serverSubusers.userUuid] }),

	index('server_subusers_server_uuid_idx').on(serverSubusers.serverUuid),
	index('server_subusers_user_uuid_idx').on(serverSubusers.userUuid)
])

export const serverActivities = pgTable('server_activities', {
	serverUuid: uuid('server_uuid').references(() => servers.uuid, { onDelete: 'cascade' }).notNull(),
	userUuid: uuid('user_uuid').references(() => users.uuid, { onDelete: 'set null' }),
	apiKeyUuid: uuid('api_key_uuid').references(() => userApiKeys.uuid, { onDelete: 'set null' }),

	event: varchar('event', { length: 255 }).notNull(),
	ip: inet('ip'),
	data: jsonb('data').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverActivities) => [
	index('server_activities_server_uuid_idx').on(serverActivities.serverUuid),
	index('server_activities_user_uuid_idx').on(serverActivities.userUuid),
	index('server_activities_server_uuid_event_idx').on(serverActivities.serverUuid, serverActivities.event),
	index('server_activities_user_uuid_event_idx').on(serverActivities.userUuid, serverActivities.event)
])

export const serverVariables = pgTable('server_variables', {
	serverUuid: uuid('server_uuid').references(() => servers.uuid, { onDelete: 'cascade' }).notNull(),
	variableUuid: uuid('variable_uuid').references(() => nestEggVariables.uuid, { onDelete: 'cascade' }).notNull(),

	value: text('value').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverVariables) => [
	primaryKey({ name: 'server_variables_pk', columns: [serverVariables.serverUuid, serverVariables.variableUuid] }),

	index('server_variables_server_uuid_idx').on(serverVariables.serverUuid),
	index('server_variables_variable_uuid_idx').on(serverVariables.variableUuid)
])

export const serverMounts = pgTable('server_mounts', {
	serverUuid: uuid('server_uuid').references(() => servers.uuid, { onDelete: 'cascade' }).notNull(),
	mountUuid: uuid('mount_uuid').references(() => mounts.uuid, { onDelete: 'cascade' }).notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverMounts) => [
	primaryKey({ name: 'server_mounts_pk', columns: [serverMounts.serverUuid, serverMounts.mountUuid] }),

	index('server_mounts_server_uuid_idx').on(serverMounts.serverUuid),
	index('server_mounts_mount_uuid_idx').on(serverMounts.mountUuid)
])

export const serverBackups = pgTable('server_backups', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	serverUuid: uuid('server_uuid').references(() => servers.uuid, { onDelete: 'set null' }),
	nodeUuid: uuid('node_uuid').references(() => nodes.uuid, { onDelete: 'cascade' }).notNull(),
	backupConfigurationUuid: uuid('backup_configuration_uuid').references(() => backupConfigurations.uuid, { onDelete: 'set null' }),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	successful: boolean('successful').default(false).notNull(),
	browsable: boolean('browsable').default(false).notNull(),
	streaming: boolean('streaming').default(false).notNull(),
	locked: boolean('locked').default(false).notNull(),

	ignoredFiles: text('ignored_files').array().notNull(),
	checksum: varchar('checksum', { length: 255 }),
	bytes: bigint('bytes', { mode: 'number' }).default(0).notNull(),
	files: bigint('files', { mode: 'number' }).default(0).notNull(),
	disk: backupDiskEnum('disk').notNull(),

	uploadId: text('upload_id'),
	uploadPath: text('upload_path'),

	completed: timestamp('completed'),
	deleted: timestamp('deleted'),
	created: timestamp('created').default(sql`now()`).notNull()
}, (serverBackups) => [
	index('server_backups_server_uuid_idx').on(serverBackups.serverUuid),
	index('server_backups_node_uuid_idx').on(serverBackups.nodeUuid),
	index('server_backups_backup_configuration_uuid_idx').on(serverBackups.backupConfigurationUuid),
	index('server_backups_successful_idx').on(serverBackups.successful),
	uniqueIndex('server_backups_uuid_idx').on(serverBackups.uuid)
])

export const serverDatabases = pgTable('server_databases', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	serverUuid: uuid('server_uuid').references(() => servers.uuid).notNull(),
	databaseHostUuid: uuid('database_host_uuid').references(() => databaseHosts.uuid).notNull(),

	name: varchar('name', { length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	locked: boolean('locked').default(false).notNull(),

	username: char('username', { length: 20 }).notNull(),
	password: bytea('password').notNull(),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverDatabases) => [
	index('server_databases_server_uuid_idx').on(serverDatabases.serverUuid),
	index('server_databases_database_host_uuid_idx').on(serverDatabases.databaseHostUuid),
	uniqueIndex('server_databases_server_uuid_database_idx').on(serverDatabases.serverUuid, serverDatabases.name)
])

export const serverSchedules = pgTable('server_schedules', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	serverUuid: uuid('server_uuid').references(() => servers.uuid, { onDelete: 'cascade' }).notNull(),

	name: varchar('name', { length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull(),
	enabled: boolean('enabled').notNull(),

	triggers: jsonb('triggers').notNull(),
	condition: jsonb('condition').notNull(),

	lastRun: timestamp('last_run'),
	lastFailure: timestamp('last_failure'),
	created: timestamp('created').default(sql`now()`).notNull()
}, (serverSchedules) => [
	index('server_schedules_server_uuid_idx').on(serverSchedules.serverUuid),
	index('server_schedules_enabled_idx').on(serverSchedules.enabled),
	uniqueIndex('server_schedules_server_uuid_name_idx').on(serverSchedules.serverUuid, serverSchedules.name)
])

export const serverScheduleSteps = pgTable('server_schedule_steps', {
	uuid: uuid('uuid').default(sql`gen_random_uuid()`).primaryKey().notNull(),
	scheduleUuid: uuid('schedule_uuid').references(() => serverSchedules.uuid, { onDelete: 'cascade' }).notNull(),

	action: jsonb('action').notNull(),
	order: smallint('order_').default(0).notNull(),
	error: text('error'),

	created: timestamp('created').default(sql`now()`).notNull()
}, (serverScheduleSteps) => [
	index('server_schedule_steps_schedule_uuid_idx').on(serverScheduleSteps.scheduleUuid)
])
