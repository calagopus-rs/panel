import { create } from 'zustand';
import { EggsSlice, createEggsSlice } from './slices/admin/eggs';
import { LocationsSlice, createLocationsSlice } from './slices/admin/locations';
import { NestsSlice, createNestsSlice } from './slices/admin/nests';
import { SettingsSlice, createSettingsSlice } from './slices/admin/settings';
import { UsersSlice, createUsersSlice } from './slices/admin/users';
import { DatabaseHostsSlice, createDatabaseHostsSlice } from './slices/admin/databasehosts';

export interface AdminStore
  extends DatabaseHostsSlice,
    EggsSlice,
    LocationsSlice,
    NestsSlice,
    SettingsSlice,
    UsersSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createDatabaseHostsSlice(...a),
  ...createEggsSlice(...a),
  ...createLocationsSlice(...a),
  ...createNestsSlice(...a),
  ...createSettingsSlice(...a),
  ...createUsersSlice(...a),
}));
