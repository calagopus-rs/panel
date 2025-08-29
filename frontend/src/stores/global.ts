import { create } from 'zustand';
import { SettingsSlice, createSettingsSlice } from './slices/global/settings';

export const useGlobalStore = create<SettingsSlice>()((...a) => ({
  ...createSettingsSlice(...a),
}));
