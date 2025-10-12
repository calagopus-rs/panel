import { create } from 'zustand';
import { EggsSlice, createEggsSlice } from './slices/admin/eggs';
import { LocationsSlice, createLocationsSlice } from './slices/admin/locations';
import { NestsSlice, createNestsSlice } from './slices/admin/nests';
import { SettingsSlice, createSettingsSlice } from './slices/admin/settings';
import { UsersSlice, createUsersSlice } from './slices/admin/users';
import { DatabaseHostsSlice, createDatabaseHostsSlice } from './slices/admin/database-hosts';
import { NodesSlice, createNodesSlice } from './slices/admin/nodes';
import { MountsSlice, createMountsSlice } from './slices/admin/mounts';
import { ServersSlice, createServersSlice } from './slices/admin/servers';
import { BackupConfigurationsSlice, createBackupConfigurationsSlice } from '@/stores/slices/admin/backupConfigurations';

export interface AdminStore
  extends BackupConfigurationsSlice,
    DatabaseHostsSlice,
    EggsSlice,
    LocationsSlice,
    NestsSlice,
    SettingsSlice,
    UsersSlice,
    NodesSlice,
    ServersSlice,
    MountsSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createBackupConfigurationsSlice(...a),
  ...createDatabaseHostsSlice(...a),
  ...createEggsSlice(...a),
  ...createLocationsSlice(...a),
  ...createNestsSlice(...a),
  ...createSettingsSlice(...a),
  ...createUsersSlice(...a),
  ...createNodesSlice(...a),
  ...createServersSlice(...a),
  ...createMountsSlice(...a),
}));
