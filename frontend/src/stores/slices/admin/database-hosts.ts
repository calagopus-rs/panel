import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface DatabaseHostsSlice {
  databaseHosts: ResponseMeta<AdminDatabaseHost>;
  setDatabaseHosts: (databaseHosts: ResponseMeta<AdminDatabaseHost>) => void;
  addDatabaseHosts: (databaseHost: AdminDatabaseHost) => void;
  removeDatabaseHosts: (databaseHost: AdminDatabaseHost) => void;
}

export const createDatabaseHostsSlice: StateCreator<AdminStore, [], [], DatabaseHostsSlice> = (
  set,
): DatabaseHostsSlice => ({
  databaseHosts: getEmptyPaginationSet<AdminDatabaseHost>(),
  setDatabaseHosts: (value) => set((state) => ({ ...state, databaseHosts: value })),
  addDatabaseHosts: (databaseHost) =>
    set((state) => ({
      databaseHosts: {
        ...state.databaseHosts,
        data: [...state.databaseHosts.data, databaseHost],
        total: state.databaseHosts.total + 1,
      },
    })),
  removeDatabaseHosts: (databaseHost) =>
    set((state) => ({
      databaseHosts: {
        ...state.databaseHosts,
        data: state.databaseHosts.data.filter((dh) => dh.uuid !== databaseHost.uuid),
        total: state.databaseHosts.total - 1,
      },
    })),
});
