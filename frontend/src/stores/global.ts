import { create } from 'zustand';
import { createPermissionsSlice, PermissionsSlice } from '@/stores/slices/global/permissions';
import { createSettingsSlice, SettingsSlice } from './slices/global/settings';

export interface GlobalStore extends PermissionsSlice, SettingsSlice {}

export const useGlobalStore = create<GlobalStore>()((...a) => ({
  ...createPermissionsSlice(...a),
  ...createSettingsSlice(...a),
}));
