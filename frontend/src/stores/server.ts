import { Server, ServerStatus } from '@/api/types';
import { create } from 'zustand';
import isEqual from 'react-fast-compare';
import { getServer } from '@/api/server/getServer';

interface ServerStore {
  data?: Server;
  permissions: string[];
  status: ServerStatus;

  // Actions
  setServer: (server: Server) => void;
  setServerFromState: (cb: (s: Server) => Server) => void;
  setPermissions: (perms: string[]) => void;
  getServer: (uuid: string) => Promise<void>;
  setStatus: (status: ServerStatus) => void;
  clear: () => void;

  // Derived state
  inConflictState: () => boolean;
  isInstalling: () => boolean;
}

export const useServerStore = create<ServerStore>((set, get) => ({
  data: undefined,
  permissions: [],
  status: null,

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

  setStatus: status => set({ status }),

  clear: () => {
    set({
      data: undefined,
      permissions: [],
      status: null,
    });
  },

  inConflictState: () => {
    const data = get().data;
    return !!(data && (data.status !== null || data.isTransferring || data.isNodeUnderMaintenance));
  },

  isInstalling: () => {
    const status = get().data?.status;
    return status === 'installing' || status === 'install_failed';
  },
}));
