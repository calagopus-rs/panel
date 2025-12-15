import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';

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
