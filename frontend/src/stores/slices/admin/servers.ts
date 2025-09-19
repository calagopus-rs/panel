import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface ServersSlice {
  servers: ResponseMeta<AdminServer>;
  serverAllocations: ResponseMeta<ServerAllocation>;
  serverMounts: ResponseMeta<AdminServerMount>

  setServers: (servers: ResponseMeta<AdminServer>) => void;
  addServer: (server: AdminServer) => void;
  removeServer: (server: AdminServer) => void;

  setServerAllocations: (allocations: ResponseMeta<ServerAllocation>) => void;
  addServerAllocation: (allocation: ServerAllocation) => void;
  removeServerAllocation: (allocation: ServerAllocation) => void;

  setServerMounts: (mounts: ResponseMeta<AdminServerMount>) => void;
  addServerMount: (mount: AdminServerMount) => void;
  removeServerMount: (mount: AdminServerMount) => void;
}

export const createServersSlice: StateCreator<AdminStore, [], [], ServersSlice> = (set): ServersSlice => ({
  servers: getEmptyPaginationSet<AdminServer>(),
  serverAllocations: getEmptyPaginationSet<ServerAllocation>(),
  serverMounts: getEmptyPaginationSet<AdminServerMount>(),

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

  setServerAllocations: (value) => set((state) => ({ ...state, serverAllocations: value })),
  addServerAllocation: (allocation) =>
    set((state) => ({
      serverAllocations: {
        ...state.serverAllocations,
        data: [...state.serverAllocations.data, allocation],
        total: state.serverAllocations.total + 1,
      }
    })),
  removeServerAllocation: (allocation) =>
    set((state) => ({
      serverAllocations: {
        ...state.serverAllocations,
        data: state.serverAllocations.data.filter((a) => a.uuid !== allocation.uuid),
        total: state.serverAllocations.total - 1,
      }
    })),

  setServerMounts: (value) => set((state) => ({ ...state, serverMounts: value })),
  addServerMount: (mount) =>
    set((state) => ({
      serverMounts: {
        ...state.serverMounts,
        data: [...state.serverMounts.data, mount],
        total: state.serverMounts.total + 1,
      }
    })),
  removeServerMount: (mount) =>
    set((state) => ({
      serverMounts: {
        ...state.serverMounts,
        data: state.serverMounts.data.filter((m) => m.mount.uuid !== mount.mount.uuid),
        total: state.serverMounts.total - 1,
      }
    })),
});
