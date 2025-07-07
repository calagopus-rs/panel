import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSettingsSlice, SettingsSlice } from './slices/admin/settings';

interface AdminStore {
  // Slices
  settings: SettingsSlice;
}

export const useAdminStore = create<AdminStore>()(
  immer((set, get) => ({
    settings: createSettingsSlice(set),
  })),
);
