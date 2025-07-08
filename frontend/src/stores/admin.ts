import { create } from 'zustand';
import { createSettingsSlice, SettingsSlice } from './slices/admin/settings';

export interface AdminStore extends SettingsSlice {}

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createSettingsSlice(...a),
}));
