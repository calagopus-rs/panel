import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

export interface SettingsSlice {
  serverListShowOthers: boolean;
  settings: PublicSettings;

  setServerListShowOthers: (show: boolean) => void;
  setSettings: (settings: PublicSettings) => void;
}

export const createSettingsSlice: StateCreator<GlobalStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  serverListShowOthers: false,
  settings: {} as PublicSettings,

  setServerListShowOthers: (value) => set((state) => ({ ...state, serverListShowOthers: value })),
  setSettings: (value) => set((state) => ({ ...state, settings: value })),
});
