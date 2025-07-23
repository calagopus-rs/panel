import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

type ServerListDesign = 'row' | 'grid';

export interface SettingsSlice {
  serverListDesign: ServerListDesign;
  settings: PublicSettings;

  setServerListDesign: (design: ServerListDesign) => void;
  setSettings: (settings: PublicSettings) => void;
}

export const createSettingsSlice: StateCreator<GlobalStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  serverListDesign: 'grid',
  settings: null,

  setServerListDesign: (value) => set((state) => ({ ...state, serverListDesign: value })),
  setSettings: (value) => set((state) => ({ ...state, settings: value })),
});
