import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface DatabasesSlice {
  databases: ResponseMeta<any>;

  setDatabases: (databases: ResponseMeta<any>) => void;
  addDatabase: (database: any) => void;
  removeDatabase: (database: any) => void;
}

export const createDatabasesSlice: StateCreator<ServerStore, [], [], DatabasesSlice> = (set): DatabasesSlice => ({
  databases: getEmptyPaginationSet<any>(),

  setDatabases: (value) => set((state) => ({ ...state, databases: value })),
  addDatabase: (database) =>
    set((state) => ({
      databases: {
        ...state.databases,
        data: [...state.databases.data, database],
        total: state.databases.total + 1,
      },
    })),
  removeDatabase: (database) =>
    set((state) => ({
      databases: {
        ...state.databases,
        data: state.databases.data.filter((d) => d.id !== database.id),
        total: state.databases.total - 1,
      },
    })),
});
