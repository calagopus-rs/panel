import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

export interface SettingsSlice {
  serverListShowOthers: boolean;
  settings: PublicSettings;
  languages: string[];

  setServerListShowOthers: (show: boolean) => void;
  setSettings: (settings: PublicSettings) => void;
  setLanguages: (languages: string[]) => void;
}

export const createSettingsSlice: StateCreator<GlobalStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  serverListShowOthers: false,
  settings: {} as PublicSettings,
  languages: [],

  setServerListShowOthers: (value) => set((state) => ({ ...state, serverListShowOthers: value })),
  setSettings: (value) => set((state) => ({ ...state, settings: value })),
  setLanguages: (value) => set((state) => ({ ...state, languages: value })),
});
