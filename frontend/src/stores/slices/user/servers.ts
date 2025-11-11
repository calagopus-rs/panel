import { getEmptyPaginationSet } from '@/api/axios';
import { UserStore } from '@/stores/user';
import { StateCreator } from 'zustand';

export interface ServerSlice {
  servers: ResponseMeta<Server>;
  serverGroups: UserServerGroup[];

  setServers: (servers: ResponseMeta<Server>) => void;
  setServerGroups: (serverGroups: UserServerGroup[]) => void;
  addServerGroup: (serverGroup: UserServerGroup) => void;
  removeServerGroup: (serverGroup: UserServerGroup) => void;
  updateServerGroup: (uuid: string, data: { name?: string; serverOrder?: string[] }) => void;
}

export const createServersSlice: StateCreator<UserStore, [], [], ServerSlice> = (set): ServerSlice => ({
  servers: getEmptyPaginationSet<Server>(),
  serverGroups: [],

  setServers: (value) => set((state) => ({ ...state, servers: value })),
  setServerGroups: (value) => set((state) => ({ ...state, serverGroups: value })),
  addServerGroup: (serverGroup) =>
    set((state) => ({
      serverGroups: [...state.serverGroups, serverGroup],
    })),
  removeServerGroup: (serverGroup) =>
    set((state) => ({
      serverGroups: state.serverGroups.filter((g) => g.uuid !== serverGroup.uuid),
    })),
  updateServerGroup: (uuid, data) =>
    set((state) => ({
      serverGroups: state.serverGroups.map((g) => (g.uuid === uuid ? { ...g, ...data } : g)),
    })),
});
