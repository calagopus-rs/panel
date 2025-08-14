import { create } from 'zustand';
import { EggsSlice, createEggsSlice } from './slices/admin/eggs';
import { LocationsSlice, createLocationsSlice } from './slices/admin/locations';
import { NestsSlice, createNestsSlice } from './slices/admin/nests';
import { SettingsSlice, createSettingsSlice } from './slices/admin/settings';

export interface AdminStore extends EggsSlice, LocationsSlice, NestsSlice, SettingsSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createEggsSlice(...a),
  ...createLocationsSlice(...a),
  ...createNestsSlice(...a),
  ...createSettingsSlice(...a),
}));
