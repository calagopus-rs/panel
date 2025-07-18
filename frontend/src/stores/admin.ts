import { create } from 'zustand';
import { LocationsSlice, createLocationsSlice } from './slices/admin/locations';
import { SettingsSlice, createSettingsSlice } from './slices/admin/settings';

export interface AdminStore extends LocationsSlice, SettingsSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createLocationsSlice(...a),
  ...createSettingsSlice(...a),
}));
