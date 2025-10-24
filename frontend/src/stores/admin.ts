import { create } from 'zustand';
import { createEggsSlice, EggsSlice } from '@/stores/slices/admin/eggs';
import { createBackupConfigurationsSlice, BackupConfigurationsSlice } from '@/stores/slices/admin/backupConfigurations';
import { createDatabaseHostsSlice, DatabaseHostsSlice } from '@/stores/slices/admin/databaseHosts';
import { createLocationsSlice, LocationsSlice } from '@/stores/slices/admin/locations';
import { createNestsSlice, NestsSlice } from '@/stores/slices/admin/nests';
import { createSettingsSlice, SettingsSlice } from '@/stores/slices/admin/settings';
import { createUsersSlice, UsersSlice } from '@/stores/slices/admin/users';
import { createNodesSlice, NodesSlice } from '@/stores/slices/admin/nodes';
import { createRolesSlice, RolesSlice } from '@/stores/slices/admin/roles';
import { createServersSlice, ServersSlice } from '@/stores/slices/admin/servers';
import { createMountsSlice, MountsSlice } from '@/stores/slices/admin/mounts';

export interface AdminStore
  extends BackupConfigurationsSlice,
    DatabaseHostsSlice,
    EggsSlice,
    LocationsSlice,
    NestsSlice,
    SettingsSlice,
    UsersSlice,
    NodesSlice,
    RolesSlice,
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
  ...createRolesSlice(...a),
  ...createServersSlice(...a),
  ...createMountsSlice(...a),
}));
