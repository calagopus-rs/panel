import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import isEqual from 'react-fast-compare';
import getServer from '@/api/server/getServer';
import { createWebsocketSlice, WebsocketSlice } from './slices/server/websocket';
import { createStatusSlice, StatusSlice } from './slices/server/status';
import { createStatsSlice, StatsSlice } from './slices/server/stats';
import { createFilesSlice, FilesSlice } from './slices/server/files';
import { createDatabasesSlice, DatabasesSlice } from './slices/server/databases';
import { createSchedulesSlice, SchedulesSlice } from './slices/server/schedules';

interface ServerStore {
  data?: ApiServer;
  permissions: string[];

  // Actions
  setServer: (server: ApiServer) => void;
  setServerFromState: (cb: (s: ApiServer) => ApiServer) => void;
  setPermissions: (perms: string[]) => void;
  getServer: (uuid: string) => Promise<void>;

  // Derived state
  inConflictState: () => boolean;
  isInstalling: () => boolean;

  // Slices
  socket: WebsocketSlice;
  status: StatusSlice;
  stats: StatsSlice;

  databases: DatabasesSlice;
  files: FilesSlice;
  schedules: SchedulesSlice;
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
      const server = await getServer(uuid);
      get().setServer(server);
    },

    inConflictState: () => {
      const data = get().data;
      return !!(data && (data.status !== null || data.nodeMaintenanceMessage));
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
    schedules: createSchedulesSlice(set),
  })),
);
