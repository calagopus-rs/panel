import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface ServerSlice {
  server: ApiServer;

  setServer: (server: ApiServer) => void;
}

export const createServerSlice: StateCreator<ServerStore, [], [], ServerSlice> = (set): ServerSlice => ({
  server: null,

  setServer: (value) => set((state) => ({ ...state, server: value })),
});
