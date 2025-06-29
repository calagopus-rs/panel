import { Server } from '@/api/types';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import isEqual from 'react-fast-compare';
import { getServer } from '@/api/server/getServer';
import { createWebsocketSlice, WebsocketSlice } from './slices/websocket';
import { createStatusSlice, StatusSlice } from './slices/status';
import { createStatsSlice, StatsSlice } from './slices/stats';
import { createFilesSlice, FilesSlice } from './slices/files';
import { createDatabasesSlice, DatabasesSlice } from './slices/databases';

interface ServerStore {
  data?: Server;
  permissions: string[];

  // Actions
  setServer: (server: Server) => void;
  setServerFromState: (cb: (s: Server) => Server) => void;
  setPermissions: (perms: string[]) => void;
  getServer: (uuid: string) => Promise<void>;
  clear: () => void;

  // Derived state
  inConflictState: () => boolean;
  isInstalling: () => boolean;

  // Slices
  socket: WebsocketSlice;
  status: StatusSlice;
  stats: StatsSlice;

  databases: DatabasesSlice;
  files: FilesSlice;
}

export const useServerStore = create<ServerStore>()(
  immer((set, get) => ({
    data: undefined,
    permissions: [],

    setServer: server => {
      if (!isEqual(get().data, server)) {
        set({ data: server });
      }
    },

    setServerFromState: cb => {
      const updated = cb(get().data!);
      if (!isEqual(updated, get().data)) {
        set({ data: updated });
      }
    },

    setPermissions: perms => {
      if (!isEqual(perms, get().permissions)) {
        set({ permissions: perms });
      }
    },

    getServer: async uuid => {
      const [server, permissions] = await getServer(uuid);
      get().setServer(server);
      get().setPermissions(permissions);
    },

    inConflictState: () => {
      const data = get().data;
      return !!(data && (data.status !== null || data.isTransferring || data.isNodeUnderMaintenance));
    },

    isInstalling: () => {
      const status = get().data?.status;
      return status === 'installing' || status === 'install_failed';
    },

    status: createStatusSlice(set),
    socket: createWebsocketSlice(set),
    stats: createStatsSlice(set),

    databases: createDatabasesSlice(set),
    files: createFilesSlice(set),

    clear: () => {
      set({
        data: undefined,
        permissions: [],

        status: createStatusSlice(set),
        socket: createWebsocketSlice(set),
        stats: createStatsSlice(set),

        databases: createDatabasesSlice(set),
        files: createFilesSlice(set),
      });
    },
  })),
);
