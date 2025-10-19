import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

type ServerListDesign = 'row' | 'grid';

export interface SettingsSlice {
  serverListDesign: ServerListDesign;
  serverListShowOthers: boolean;
  settings: PublicSettings;

  setServerListDesign: (design: ServerListDesign) => void;
  setServerListShowOthers: (show: boolean) => void;
  setSettings: (settings: PublicSettings) => void;
}

export const createSettingsSlice: StateCreator<GlobalStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  serverListDesign: 'grid',
  serverListShowOthers: false,
  settings: null,

  setServerListDesign: (value) => set((state) => ({ ...state, serverListDesign: value })),
  setServerListShowOthers: (value) => set((state) => ({ ...state, serverListShowOthers: value })),
  setSettings: (value) => set((state) => ({ ...state, settings: value })),
});
