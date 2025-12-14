import { StateCreator } from 'zustand';
import { ServerStore } from '@/stores/server.ts';

export interface StateSlice {
  state: ServerPowerState;

  setState: (status: ServerPowerState) => void;
}

export const createStateSlice: StateCreator<ServerStore, [], [], StateSlice> = (set): StateSlice => ({
  state: 'offline',

  setState: (value) => set((state) => ({ ...state, state: value })),
});
