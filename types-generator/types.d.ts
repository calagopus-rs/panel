interface AdminApiDatabaseHost {
  id: number;
  name: string;
  type: DatabaseType;
  public_host: undefined;
  host: string;
  public_port: undefined;
  port: number;
  username: string;
  created: string;
}
interface AdminApiLocation {
  id: number;
  short_name: string;
  name: string;
  description: undefined;
  nodes: number;
  created: string;
}
interface AdminApiNest {
  id: number;
  author: string;
  name: string;
  description: undefined;
  eggs: number;
  created: string;
}
interface AdminApiNode {
  id: number;
  uuid: string;
  location: AdminApiLocation;
  database_host: undefined;
  name: string;
  public: boolean;
  description: undefined;
  public_host: undefined;
  host: string;
  ssl: boolean;
  sftp_host: undefined;
  sftp_port: number;
  maintenance_message: undefined;
  memory: number;
  disk: number;
  token_id: string;
  servers: number;
  created: string;
}
interface AdminApiNodeAllocation {
  id: number;
  ip: string;
  ip_alias: undefined;
  port: number;
  created: string;
}
interface ApiError {
  errors: undefined[];
}
interface ApiNestEgg {
  id: number;
  name: string;
  description: undefined;
  startup: string;
  features: undefined[];
  docker_images: undefined;
  created: string;
}
interface ApiServer {
  id: number;
  uuid: string;
  uuid_short: string;
  allocation: undefined;
  egg: ApiNestEgg;
  is_owner: boolean;
  permissions: undefined[];
  node_uuid: string;
  node_name: string;
  sftp_host: string;
  sftp_port: number;
  name: string;
  description: undefined;
  limits: {
  cpu: number;
  memory: number;
  swap: number;
  disk: number;
  io: number;
};
  feature_limits: {
  allocations: number;
  databases: number;
  backups: number;
};
  startup: string;
  image: string;
  created: string;
}
interface ApiServerActivity {
  id: number;
  user: ApiUser;
  event: string;
  ip: string;
  data: undefined;
  is_api: boolean;
  created: string;
}
interface ApiServerAllocation {
  ip: string;
  ip_alias: undefined;
  port: number;
  notes: undefined;
  is_default: boolean;
  created: string;
}
interface ApiUser {
  id: number;
  avatar: undefined;
  username: string;
  email: string;
  name_first: string;
  name_last: string;
  admin: boolean;
  totp_enabled: boolean;
  created: string;
}
interface ApiUserActivity {
  id: number;
  event: string;
  ip: string;
  data: undefined;
  is_api: boolean;
  created: string;
}
interface ApiUserApiKey {
  id: number;
  name: string;
  key_start: string;
  permissions: undefined[];
  last_used: undefined;
  created: string;
}
interface ApiUserSshKey {
  id: number;
  name: string;
  fingerprint: string;
  created: string;
}
type DatabaseType = 'mariadb' | 'postgresql';
interface Pagination_DirectoryEntry {
  total: number;
  per_page: number;
  page: number;
  data: undefined[];
}
type ServerPowerAction = 'start' | 'stop' | 'restart' | 'kill';
