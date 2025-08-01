import { create } from 'zustand';
import { LocationsSlice, createLocationsSlice } from './slices/admin/locations';
import { NodesSlice, createNodesSlice } from './slices/admin/nodes';
import { SettingsSlice, createSettingsSlice } from './slices/admin/settings';
import { ServersSlice, createServersSlice } from './slices/admin/servers';

export interface AdminStore extends LocationsSlice, NodesSlice, SettingsSlice, ServersSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createLocationsSlice(...a),
  ...createNodesSlice(...a),
  ...createSettingsSlice(...a),
  ...createServersSlice(...a),
}));
