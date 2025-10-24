import { create } from 'zustand';
import { createSettingsSlice, SettingsSlice } from './slices/global/settings';
import { createPermissionsSlice, PermissionsSlice } from '@/stores/slices/global/permissions';

export interface GlobalStore extends PermissionsSlice, SettingsSlice {}

export const useGlobalStore = create<GlobalStore>()((...a) => ({
  ...createPermissionsSlice(...a),
  ...createSettingsSlice(...a),
}));
