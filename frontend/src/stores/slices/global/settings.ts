import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

type ServerListDesign = 'row' | 'grid';

export interface SettingsSlice {
  serverListDesign: ServerListDesign;

  setServerListDesign: (design: ServerListDesign) => void;
}

export const createSettingsSlice: StateCreator<GlobalStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  serverListDesign: 'grid',

  setServerListDesign: value => set(state => ({ ...state, serverListDesign: value })),
});
