import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface DatabasesSlice {
  databases: ResponseMeta<ServerDatabase>;

  setDatabases: (databases: ResponseMeta<ServerDatabase>) => void;
  addDatabase: (database: ServerDatabase) => void;
  removeDatabase: (database: ServerDatabase) => void;
}

export const createDatabasesSlice: StateCreator<ServerStore, [], [], DatabasesSlice> = (set): DatabasesSlice => ({
  databases: getEmptyPaginationSet<ServerDatabase>(),

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
        data: state.databases.data.filter((d) => d.uuid !== database.uuid),
        total: state.databases.total - 1,
      },
    })),
});
