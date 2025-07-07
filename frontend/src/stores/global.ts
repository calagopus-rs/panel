import { create } from 'zustand';
import { createSettingsSlice, SettingsSlice } from './slices/global/settings';
import { AuthSlice, createAuthSlice } from './slices/global/auth';

export interface GlobalStore extends SettingsSlice, AuthSlice {}

export const useGlobalStore = create<GlobalStore>()((...a) => ({
  ...createSettingsSlice(...a),
  ...createAuthSlice(...a),
}));
