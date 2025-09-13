import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface ServersSlice {
  servers: ResponseMeta<AdminServer>;

  setServers: (servers: ResponseMeta<AdminServer>) => void;
  addServer: (server: AdminServer) => void;
  removeServer: (server: AdminServer) => void;
}

export const createServersSlice: StateCreator<AdminStore, [], [], ServersSlice> = (set): ServersSlice => ({
  servers: getEmptyPaginationSet<AdminServer>(),

  setServers: (value) => set((state) => ({ ...state, servers: value })),
  addServer: (server) =>
    set((state) => ({
      servers: {
        ...state.servers,
        data: [...state.servers.data, server],
        total: state.servers.total + 1,
      },
    })),
  removeServer: (server) =>
    set((state) => ({
      servers: {
        ...state.servers,
        data: state.servers.data.filter((s) => s.uuid !== server.uuid),
        total: state.servers.total - 1,
      },
    })),
});
