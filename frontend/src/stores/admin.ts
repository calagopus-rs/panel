import { create } from 'zustand';
import { LocationsSlice, createLocationsSlice } from './slices/admin/locations';
import { SettingsSlice, createSettingsSlice } from './slices/admin/settings';
import { ServersSlice, createServersSlice } from './slices/admin/servers';

export interface AdminStore extends LocationsSlice, SettingsSlice, ServersSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createLocationsSlice(...a),
  ...createSettingsSlice(...a),
  ...createServersSlice(...a),
}));
