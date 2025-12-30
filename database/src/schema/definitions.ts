import { sql } from 'drizzle-orm';
import { bytea, DatabaseEnum, DatabaseTable, UTF8_MAX_SCALAR_SIZE } from '@/schema/table';
import {
  PgColumn,
  bigint,
  boolean,
  char,
  index,
  inet,
  integer,
  jsonb,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const databaseTypeEnum = new DatabaseEnum('database_type', ['MYSQL', 'POSTGRES']);
export const serverStatusEnum = new DatabaseEnum('server_status', ['INSTALLING', 'INSTALL_FAILED', 'RESTORING_BACKUP']);
export const backupDiskEnum = new DatabaseEnum('backup_disk', ['LOCAL', 'S3', 'DDUP_BAK', 'BTRFS', 'ZFS', 'RESTIC']);
export const userToastPositionEnum = new DatabaseEnum('user_toast_position', [
  'TOP_LEFT',
  'TOP_CENTER',
  'TOP_RIGHT',
  'BOTTOM_LEFT',
  'BOTTOM_CENTER',
  'BOTTOM_RIGHT',
]);

export const settingsTable = new DatabaseTable('settings')
  .addColumn('key', varchar({ length: 255 }).primaryKey().notNull())
  .addColumn('value', text().notNull());

export const adminActivitiesTable = new DatabaseTable('admin_activities')
  .addColumn(
    'user_uuid',
    uuid().references(() => usersTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn(
    'api_key_uuid',
    uuid().references(() => userApiKeysTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('event', varchar({ length: 255 }).notNull())
  .addColumn('ip', inet())
  .addColumn('data', jsonb().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('admin_activities_user_uuid_idx').on(cols.user_uuid),
    index('admin_activities_event_idx').on(cols.event),
    index('admin_activities_user_uuid_event_idx').on(cols.user_uuid, cols.event),
  ]);

export const usersTable = new DatabaseTable('users')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'role_uuid',
    uuid().references(() => rolesTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('external_id', varchar({ length: 255 }))
  .addColumn('avatar', varchar({ length: 255 }))
  .addColumn('username', varchar({ length: 15 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('email', varchar({ length: 255 }).notNull())
  .addColumn('name_first', varchar({ length: 255 }).notNull())
  .addColumn('name_last', varchar({ length: 255 }).notNull())
  .addColumn('password', text().notNull())
  .addColumn('admin', boolean().default(false).notNull())
  .addColumn('totp_enabled', boolean().default(false).notNull())
  .addColumn('totp_last_used', timestamp())
  .addColumn('totp_secret', char({ length: 32 }))
  .addColumn('language', varchar({ length: 15 }).default('en-US').notNull())
  .addColumn('toast_position', userToastPositionEnum.intoDrizzleEnum()().default('BOTTOM_RIGHT').notNull())
  .addColumn('start_on_grouped_servers', boolean().default(false).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    uniqueIndex('users_external_id_idx').on(cols.external_id),
    uniqueIndex('users_username_idx').on(sql`lower(${cols.username})`),
    uniqueIndex('users_email_idx').on(sql`lower(${cols.email})`),
  ]);

export const userActivitiesTable = new DatabaseTable('user_activities')
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'api_key_uuid',
    uuid().references(() => userApiKeysTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('event', varchar({ length: 255 }).notNull())
  .addColumn('ip', inet())
  .addColumn('data', jsonb().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('user_activities_user_id_idx').on(cols.user_uuid),
    index('user_activities_user_id_event_idx').on(cols.user_uuid, cols.event),
  ]);

export const userSessionsTable = new DatabaseTable('user_sessions')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('key_id', char({ length: 16 }).notNull())
  .addColumn('key', text().notNull())
  .addColumn('ip', inet().notNull())
  .addColumn('user_agent', varchar({ length: 255 }).notNull())
  .addColumn('last_used', timestamp().defaultNow().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('user_sessions_user_id_idx').on(cols.user_uuid),
    uniqueIndex('user_sessions_key_idx').on(cols.key),
  ]);

export const userRecoveryCodesTable = new DatabaseTable('user_recovery_codes')
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('code', char({ length: 10 }).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    primaryKey({ name: 'user_recovery_codes_user_uuid_code_idx', columns: [cols.user_uuid, cols.code] }),
    index('user_recovery_codes_user_uuid_idx').on(cols.user_uuid),
  ]);

export const userPasswordResetsTable = new DatabaseTable('user_password_resets')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('token', text().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('user_password_resets_user_uuid_idx').on(cols.user_uuid),
    uniqueIndex('user_password_resets_token_idx').on(cols.token),
  ]);

export const userSecurityKeysTable = new DatabaseTable('user_security_keys')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('name', varchar({ length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('credential_id', bytea().notNull())
  .addColumn('passkey', jsonb())
  .addColumn('registration', jsonb())
  .addColumn('last_used', timestamp())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('user_security_keys_user_uuid_idx').on(cols.user_uuid),
    uniqueIndex('user_security_keys_user_uuid_name_idx').on(cols.user_uuid, cols.name),
    uniqueIndex('user_security_keys_user_uuid_credential_id_idx').on(cols.user_uuid, cols.credential_id),
  ]);

export const userSshKeysTable = new DatabaseTable('user_ssh_keys')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('name', varchar({ length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('fingerprint', char({ length: 50 }).notNull())
  .addColumn('public_key', bytea().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('user_ssh_keys_user_uuid_idx').on(cols.user_uuid),
    uniqueIndex('user_ssh_keys_user_uuid_name_idx').on(cols.user_uuid, cols.name),
    uniqueIndex('user_ssh_keys_user_uuid_fingerprint_idx').on(cols.user_uuid, cols.fingerprint),
  ]);

export const userApiKeysTable = new DatabaseTable('user_api_keys')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('name', varchar({ length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('key_start', char({ length: 16 }).notNull())
  .addColumn('key', text().notNull())
  .addColumn('allowed_ips', inet().array().default([]).notNull())
  .addColumn('user_permissions', varchar({ length: 64 }).array().notNull())
  .addColumn('admin_permissions', varchar({ length: 64 }).array().notNull())
  .addColumn('server_permissions', varchar({ length: 64 }).array().notNull())
  .addColumn('last_used', timestamp())
  .addColumn('expires', timestamp())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('user_api_keys_user_uuid_idx').on(cols.user_uuid),
    uniqueIndex('user_api_keys_user_uuid_name_idx').on(cols.user_uuid, cols.name),
    uniqueIndex('user_api_keys_user_uuid_key_start_idx').on(cols.user_uuid, cols.key_start),
    uniqueIndex('user_api_keys_key_idx').on(cols.key),
  ]);

export const userOauthLinksTable = new DatabaseTable('user_oauth_links')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'oauth_provider_uuid',
    uuid()
      .references(() => oauthProvidersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('identifier', varchar({ length: 255 }).notNull())
  .addColumn('last_used', timestamp())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('user_oauth_links_user_uuid_idx').on(cols.user_uuid),
    index('user_oauth_links_oauth_provider_uuid_idx').on(cols.oauth_provider_uuid),
    uniqueIndex('user_oauth_links_user_uuid_oauth_provider_uuid_idx').on(cols.user_uuid, cols.oauth_provider_uuid),
    uniqueIndex('user_oauth_links_oauth_provider_uuid_identifier_idx').on(cols.oauth_provider_uuid, cols.identifier),
  ]);

export const userServerGroupsTable = new DatabaseTable('user_server_groups')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('name', varchar({ length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('order_', smallint().default(0).notNull())
  .addColumn('server_order', uuid().array().default([]).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [index('server_groups_user_uuid_idx').on(cols.user_uuid)]);

export const rolesTable = new DatabaseTable('roles')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('require_two_factor', boolean().default(false).notNull())
  .addColumn('admin_permissions', varchar({ length: 64 }).array().notNull())
  .addColumn('server_permissions', varchar({ length: 64 }).array().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [uniqueIndex('roles_name_idx').on(cols.name)]);

export const oauthProvidersTable = new DatabaseTable('oauth_providers')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('client_id', varchar({ length: 255 }).notNull())
  .addColumn('client_secret', bytea().notNull())
  .addColumn('auth_url', varchar({ length: 255 }).notNull())
  .addColumn('token_url', varchar({ length: 255 }).notNull())
  .addColumn('info_url', varchar({ length: 64 }).notNull())
  .addColumn('scopes', varchar({ length: 64 }).array().notNull())
  .addColumn('identifier_path', varchar({ length: 255 }).notNull())
  .addColumn('email_path', varchar({ length: 255 }))
  .addColumn('username_path', varchar({ length: 255 }))
  .addColumn('name_first_path', varchar({ length: 255 }))
  .addColumn('name_last_path', varchar({ length: 255 }))
  .addColumn('enabled', boolean().default(false).notNull())
  .addColumn('login_only', boolean().default(false).notNull())
  .addColumn('link_viewable', boolean().default(false).notNull())
  .addColumn('user_manageable', boolean().default(false).notNull())
  .addColumn('basic_auth', boolean().default(false).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [uniqueIndex('oauth_providers_name_idx').on(cols.name)]);

export const mountsTable = new DatabaseTable('mounts')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('source', varchar({ length: 255 }).notNull())
  .addColumn('target', varchar({ length: 255 }).notNull())
  .addColumn('read_only', boolean().default(false).notNull())
  .addColumn('user_mountable', boolean().default(false).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    uniqueIndex('mounts_name_idx').on(cols.name),
    uniqueIndex('mounts_source_target_idx').on(cols.source, cols.target),
  ]);

export const backupConfigurationsTable = new DatabaseTable('backup_configurations')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('backup_disk', backupDiskEnum.intoDrizzleEnum()().default('LOCAL').notNull())
  .addColumn('backup_configs', jsonb().default({}).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [uniqueIndex('backup_configurations_name_idx').on(cols.name)]);

export const locationsTable = new DatabaseTable('locations')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'backup_configuration_uuid',
    uuid().references(() => backupConfigurationsTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('locations_backup_configuration_uuid_idx').on(cols.backup_configuration_uuid),
    uniqueIndex('locations_name_idx').on(cols.name),
  ]);

export const locationDatabaseHostsTable = new DatabaseTable('location_database_hosts')
  .addColumn(
    'location_uuid',
    uuid()
      .references(() => locationsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'database_host_uuid',
    uuid()
      .references(() => databaseHostsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    primaryKey({ name: 'location_database_hosts_pk', columns: [cols.location_uuid, cols.database_host_uuid] }),
    index('location_database_hosts_location_uuid_idx').on(cols.location_uuid),
    index('location_database_hosts_database_host_uuid_idx').on(cols.database_host_uuid),
  ]);

export const nodesTable = new DatabaseTable('nodes')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'location_uuid',
    uuid()
      .references(() => locationsTable.join().uuid)
      .notNull(),
  )
  .addColumn(
    'backup_configuration_uuid',
    uuid().references(() => backupConfigurationsTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('public', boolean().notNull())
  .addColumn('description', text())
  .addColumn('public_url', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }))
  .addColumn('url', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('sftp_host', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }))
  .addColumn('sftp_port', integer().notNull())
  .addColumn('maintenance_message', text())
  .addColumn('memory', bigint({ mode: 'number' }).notNull())
  .addColumn('disk', bigint({ mode: 'number' }).notNull())
  .addColumn('token_id', char({ length: 16 }).notNull())
  .addColumn('token', bytea().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('nodes_location_uuid_idx').on(cols.location_uuid),
    index('nodes_backup_configuration_uuid_idx').on(cols.backup_configuration_uuid),
    uniqueIndex('nodes_uuid_idx').on(cols.uuid),
    uniqueIndex('nodes_name_idx').on(cols.name),
    uniqueIndex('nodes_token_id_idx').on(cols.token_id),
    uniqueIndex('nodes_token_idx').on(cols.token),
  ]);

export const nodeMountsTable = new DatabaseTable('node_mounts')
  .addColumn(
    'node_uuid',
    uuid()
      .references(() => nodesTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'mount_uuid',
    uuid()
      .references(() => mountsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    primaryKey({ name: 'node_mounts_pk', columns: [cols.node_uuid, cols.mount_uuid] }),
    index('node_mounts_node_uuid_idx').on(cols.node_uuid),
    index('node_mounts_mount_uuid_idx').on(cols.mount_uuid),
  ]);

export const nodeAllocationsTable = new DatabaseTable('node_allocations')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'node_uuid',
    uuid()
      .references(() => nodesTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('ip', inet().notNull())
  .addColumn('ip_alias', varchar({ length: 255 }))
  .addColumn('port', integer().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('allocations_node_uuid_idx').on(cols.node_uuid),
    uniqueIndex('allocations_node_uuid_ip_port_idx').on(cols.node_uuid, sql`host(${cols.ip})`, cols.port),
  ]);

export const eggRepositoriesTable = new DatabaseTable('egg_repositories')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('git_repository', text().notNull())
  .addColumn('last_synced', timestamp())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    uniqueIndex('egg_repositories_name_idx').on(cols.name),
    uniqueIndex('egg_repositories_git_repository_idx').on(cols.git_repository),
  ]);

export const eggRepositoriesEggsTable = new DatabaseTable('egg_repository_eggs')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'egg_repository_uuid',
    uuid()
      .references(() => eggRepositoriesTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('path', text().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('author', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('exported_egg', jsonb().notNull())
  .addConfigBuilder((cols) => [
    index('egg_repository_eggs_egg_repository_uuid_idx').on(cols.egg_repository_uuid),
    uniqueIndex('egg_repository_eggs_egg_repository_uuid_path_idx').on(cols.egg_repository_uuid, cols.path),
  ]);

export const nestsTable = new DatabaseTable('nests')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('author', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [uniqueIndex('nests_name_idx').on(cols.name)]);

export const nestEggsTable = new DatabaseTable('nest_eggs')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'nest_uuid',
    uuid()
      .references(() => nestsTable.join().uuid)
      .notNull(),
  )
  .addColumn(
    'egg_repository_egg_uuid',
    uuid().references(() => eggRepositoriesEggsTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('author', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('config_files', jsonb().notNull())
  .addColumn('config_startup', jsonb().notNull())
  .addColumn('config_stop', jsonb().notNull())
  .addColumn('config_script', jsonb().notNull())
  .addColumn('config_allocations', jsonb().default({}).notNull())
  .addColumn('startup', text().notNull())
  .addColumn('force_outgoing_ip', boolean().default(false).notNull())
  .addColumn('separate_port', boolean().default(false).notNull())
  .addColumn('features', text().array().notNull())
  .addColumn('docker_images', text().notNull())
  .addColumn('file_denylist', text().array().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('eggs_nest_uuid_idx').on(cols.nest_uuid),
    index('eggs_egg_repository_egg_uuid_idx').on(cols.egg_repository_egg_uuid),
    uniqueIndex('eggs_nest_uuid_name_idx').on(cols.nest_uuid, cols.name),
  ]);

export const nestEggMountsTable = new DatabaseTable('nest_egg_mounts')
  .addColumn(
    'egg_uuid',
    uuid()
      .references(() => nestEggsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'mount_uuid',
    uuid()
      .references(() => mountsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    primaryKey({ name: 'egg_mounts_pk', columns: [cols.egg_uuid, cols.mount_uuid] }),
    index('egg_mounts_egg_uuid_idx').on(cols.egg_uuid),
    index('egg_mounts_mount_uuid_idx').on(cols.mount_uuid),
  ]);

export const nestEggVariablesTable = new DatabaseTable('nest_egg_variables')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'egg_uuid',
    uuid()
      .references(() => nestEggsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('order_', smallint().default(0).notNull())
  .addColumn('env_variable', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('default_value', text())
  .addColumn('user_viewable', boolean().default(true).notNull())
  .addColumn('user_editable', boolean().default(false).notNull())
  .addColumn('rules', text().array().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('egg_variables_egg_uuid_idx').on(cols.egg_uuid),
    uniqueIndex('egg_variables_egg_uuid_name_idx').on(cols.egg_uuid, cols.name),
    uniqueIndex('egg_variables_egg_uuid_env_variable_idx').on(cols.egg_uuid, cols.env_variable),
  ]);

export const databaseHostsTable = new DatabaseTable('database_hosts')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('public', boolean().default(false).notNull())
  .addColumn('type', databaseTypeEnum.intoDrizzleEnum()().notNull())
  .addColumn('public_host', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }))
  .addColumn('host', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('public_port', integer())
  .addColumn('port', integer().notNull())
  .addColumn('username', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('password', bytea().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    uniqueIndex('database_hosts_name_idx').on(cols.name),
    uniqueIndex('database_hosts_host_port_idx').on(cols.host, cols.port),
  ]);

export const serversTable = new DatabaseTable('servers')
  .addColumn('uuid', uuid().primaryKey().notNull())
  .addColumn('uuid_short', integer().notNull())
  .addColumn('external_id', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }))
  .addColumn(
    'allocation_uuid',
    uuid().references((): PgColumn => serverAllocationsTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn(
    'destination_allocation_uuid',
    uuid().references((): PgColumn => serverAllocationsTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn(
    'node_uuid',
    uuid()
      .references(() => nodesTable.join().uuid)
      .notNull(),
  )
  .addColumn(
    'destination_node_uuid',
    uuid().references(() => nodesTable.join().uuid),
  )
  .addColumn(
    'owner_uuid',
    uuid()
      .references(() => usersTable.join().uuid)
      .notNull(),
  )
  .addColumn(
    'egg_uuid',
    uuid()
      .references(() => nestEggsTable.join().uuid)
      .notNull(),
  )
  .addColumn(
    'backup_configuration_uuid',
    uuid().references(() => backupConfigurationsTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('description', text())
  .addColumn('status', serverStatusEnum.intoDrizzleEnum()())
  .addColumn('suspended', boolean().default(false).notNull())
  .addColumn('memory', bigint({ mode: 'number' }).notNull())
  .addColumn('swap', bigint({ mode: 'number' }).notNull())
  .addColumn('disk', bigint({ mode: 'number' }).notNull())
  .addColumn('io_weight', smallint())
  .addColumn('cpu', integer().notNull())
  .addColumn('pinned_cpus', smallint().array().notNull())
  .addColumn('startup', text().notNull())
  .addColumn('image', varchar({ length: 255 }).notNull())
  .addColumn('auto_kill', jsonb().default({ enabled: false, seconds: 30 }).notNull())
  .addColumn('timezone', varchar({ length: 255 }))
  .addColumn('allocation_limit', integer().default(0).notNull())
  .addColumn('database_limit', integer().default(0).notNull())
  .addColumn('backup_limit', integer().default(0).notNull())
  .addColumn('schedule_limit', integer().default(0).notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('servers_external_id_idx').on(cols.external_id),
    index('servers_allocation_uuid_idx').on(cols.allocation_uuid),
    index('servers_node_uuid_idx').on(cols.node_uuid),
    index('servers_owner_uuid_idx').on(cols.owner_uuid),
    index('servers_egg_uuid_idx').on(cols.egg_uuid),
    index('servers_backup_configuration_uuid_idx').on(cols.backup_configuration_uuid),
    uniqueIndex('servers_uuid_short_idx').on(cols.uuid_short),
  ]);

export const serverAllocationsTable = new DatabaseTable('server_allocations')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'server_uuid',
    uuid()
      .references(() => serversTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'allocation_uuid',
    uuid()
      .references(() => nodeAllocationsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('notes', text())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('server_allocations_server_uuid_idx').on(cols.server_uuid),
    uniqueIndex('server_allocations_allocation_uuid_idx').on(cols.allocation_uuid),
  ]);

export const serverSubusersTable = new DatabaseTable('server_subusers')
  .addColumn(
    'server_uuid',
    uuid()
      .references(() => serversTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'user_uuid',
    uuid()
      .references(() => usersTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('permissions', varchar({ length: 32 }).array().notNull())
  .addColumn('ignored_files', text().array().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    primaryKey({ name: 'server_subusers_pk', columns: [cols.server_uuid, cols.user_uuid] }),
    index('server_subusers_server_uuid_idx').on(cols.server_uuid),
    index('server_subusers_user_uuid_idx').on(cols.user_uuid),
  ]);

export const serverActivitiesTable = new DatabaseTable('server_activities')
  .addColumn(
    'server_uuid',
    uuid()
      .references(() => serversTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'user_uuid',
    uuid().references(() => usersTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn(
    'api_key_uuid',
    uuid().references(() => userApiKeysTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('event', varchar({ length: 255 }).notNull())
  .addColumn('ip', inet())
  .addColumn('data', jsonb().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('server_activities_server_uuid_idx').on(cols.server_uuid),
    index('server_activities_user_uuid_idx').on(cols.user_uuid),
    index('server_activities_server_uuid_event_idx').on(cols.server_uuid, cols.event),
    index('server_activities_user_uuid_event_idx').on(cols.user_uuid, cols.event),
  ]);

export const serverVariablesTable = new DatabaseTable('server_variables')
  .addColumn(
    'server_uuid',
    uuid()
      .references(() => serversTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'variable_uuid',
    uuid()
      .references(() => nestEggVariablesTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('value', text().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    primaryKey({ name: 'server_variables_pk', columns: [cols.server_uuid, cols.variable_uuid] }),
    index('server_variables_server_uuid_idx').on(cols.server_uuid),
    index('server_variables_variable_uuid_idx').on(cols.variable_uuid),
  ]);

export const serverMountsTable = new DatabaseTable('server_mounts')
  .addColumn(
    'server_uuid',
    uuid()
      .references(() => serversTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'mount_uuid',
    uuid()
      .references(() => mountsTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    primaryKey({ name: 'server_mounts_pk', columns: [cols.server_uuid, cols.mount_uuid] }),
    index('server_mounts_server_uuid_idx').on(cols.server_uuid),
    index('server_mounts_mount_uuid_idx').on(cols.mount_uuid),
  ]);

export const serverBackupsTable = new DatabaseTable('server_backups')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'server_uuid',
    uuid().references(() => serversTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn(
    'node_uuid',
    uuid()
      .references(() => nodesTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn(
    'backup_configuration_uuid',
    uuid().references(() => backupConfigurationsTable.join().uuid, { onDelete: 'set null' }),
  )
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('successful', boolean().default(false).notNull())
  .addColumn('browsable', boolean().default(false).notNull())
  .addColumn('streaming', boolean().default(false).notNull())
  .addColumn('locked', boolean().default(false).notNull())
  .addColumn('ignored_files', text().array().notNull())
  .addColumn('checksum', varchar({ length: 255 }))
  .addColumn('bytes', bigint({ mode: 'number' }).default(0).notNull())
  .addColumn('files', bigint({ mode: 'number' }).default(0).notNull())
  .addColumn('disk', backupDiskEnum.intoDrizzleEnum()().notNull())
  .addColumn('upload_id', text())
  .addColumn('upload_path', text())
  .addColumn('completed', timestamp())
  .addColumn('deleted', timestamp())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('server_backups_server_uuid_idx').on(cols.server_uuid),
    index('server_backups_node_uuid_idx').on(cols.node_uuid),
    index('server_backups_backup_configuration_uuid_idx').on(cols.backup_configuration_uuid),
    index('server_backups_successful_idx').on(cols.successful),
    uniqueIndex('server_backups_uuid_idx').on(cols.uuid),
  ]);

export const serverDatabasesTable = new DatabaseTable('server_databases')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'server_uuid',
    uuid()
      .references(() => serversTable.join().uuid)
      .notNull(),
  )
  .addColumn(
    'database_host_uuid',
    uuid()
      .references(() => databaseHostsTable.join().uuid)
      .notNull(),
  )
  .addColumn('name', varchar({ length: 31 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('locked', boolean().default(false).notNull())
  .addColumn('username', char({ length: 20 }).notNull())
  .addColumn('password', bytea().notNull())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('server_databases_server_uuid_idx').on(cols.server_uuid),
    index('server_databases_database_host_uuid_idx').on(cols.database_host_uuid),
    uniqueIndex('server_databases_server_uuid_database_idx').on(cols.server_uuid, cols.name),
  ]);

export const serverSchedulesTable = new DatabaseTable('server_schedules')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'server_uuid',
    uuid()
      .references(() => serversTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('name', varchar({ length: 255 * UTF8_MAX_SCALAR_SIZE }).notNull())
  .addColumn('enabled', boolean().notNull())
  .addColumn('triggers', jsonb().notNull())
  .addColumn('condition', jsonb().notNull())
  .addColumn('last_run', timestamp())
  .addColumn('last_failure', timestamp())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [
    index('server_schedules_server_uuid_idx').on(cols.server_uuid),
    index('server_schedules_enabled_idx').on(cols.enabled),
    uniqueIndex('server_schedules_server_uuid_name_idx').on(cols.server_uuid, cols.name),
  ]);

export const serverScheduleStepsTable = new DatabaseTable('server_schedule_steps')
  .addColumn('uuid', uuid().default(sql`gen_random_uuid()`).primaryKey().notNull())
  .addColumn(
    'schedule_uuid',
    uuid()
      .references(() => serverSchedulesTable.join().uuid, { onDelete: 'cascade' })
      .notNull(),
  )
  .addColumn('action', jsonb().notNull())
  .addColumn('order_', smallint().default(0).notNull())
  .addColumn('error', text())
  .addColumn('created', timestamp().defaultNow().notNull())
  .addConfigBuilder((cols) => [index('server_schedule_steps_schedule_uuid_idx').on(cols.schedule_uuid)]);
