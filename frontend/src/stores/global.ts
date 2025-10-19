import { create } from 'zustand';
import { SettingsSlice, createSettingsSlice } from './slices/global/settings';

export interface GlobalStore extends SettingsSlice {}

export const useGlobalStore = create<SettingsSlice>()((...a) => ({
  ...createSettingsSlice(...a),
}));
