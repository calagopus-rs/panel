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

  setDatabases: value => set(state => ({ ...state, databases: value })),

  addDatabase: value =>
    set(state => {
      state.databases.data = [...state.databases.data, value];
      state.databases.total += 1;
      return state;
    }),

  removeDatabase: value =>
    set(state => {
      state.databases.data = state.databases.data.filter(key => key.id !== value.id);
      state.databases.total -= 1;
      return state;
    }),
});
