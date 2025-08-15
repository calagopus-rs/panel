import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface ServerSlice {
  server: Server;

  setServer: (server: Server) => void;
  updateServer: (updatedProps: Partial<Server>) => void;
}

export const createServerSlice: StateCreator<ServerStore, [], [], ServerSlice> = (set): ServerSlice => ({
  server: null,

  setServer: (value) => set((state) => ({ ...state, server: value })),
  updateServer: (updatedProps) =>
    set((state) => ({
      server: { ...state.server, ...updatedProps },
    })),
});
