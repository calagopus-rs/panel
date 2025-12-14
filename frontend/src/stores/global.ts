import { create } from 'zustand';
import { createPermissionsSlice, PermissionsSlice } from '@/stores/slices/global/permissions.ts';
import { createSettingsSlice, SettingsSlice } from './slices/global/settings.ts';

export interface GlobalStore extends PermissionsSlice, SettingsSlice {}

export const useGlobalStore = create<GlobalStore>()((...a) => ({
  ...createPermissionsSlice(...a),
  ...createSettingsSlice(...a),
}));
