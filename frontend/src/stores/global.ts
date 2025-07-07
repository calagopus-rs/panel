import { create } from 'zustand';
import { AuthSlice, createAuthSlice } from './slices/global/auth';
import { SettingsSlice, createSettingsSlice } from './slices/global/settings';

export interface GlobalStore extends AuthSlice, SettingsSlice {}

export const useGlobalStore = create<GlobalStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createSettingsSlice(...a),
}));
