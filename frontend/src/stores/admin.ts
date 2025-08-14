import { create } from 'zustand';
import { LocationsSlice, createLocationsSlice } from './slices/admin/locations';
import { SettingsSlice, createSettingsSlice } from './slices/admin/settings';
import { NestsSlice, createNestsSlice } from './slices/admin/nests';

export interface AdminStore extends LocationsSlice, NestsSlice, SettingsSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createLocationsSlice(...a),
  ...createNestsSlice(...a),
  ...createSettingsSlice(...a),
}));
