import { ServerDatabase } from '@/api/types';

export interface DatabasesSlice {
  databases: ServerDatabase[];

  setDatabases: (databases: ServerDatabase[]) => void;
  addDatabase: (database: ServerDatabase) => void;
  removeDatabase: (database: ServerDatabase) => void;
}

export const createDatabasesSlice = (set): DatabasesSlice => ({
  databases: [],

  setDatabases: value =>
    set(state => {
      state.databases.databases = value;
    }),

  addDatabase: value =>
    set(state => {
      state.databases.databases = [...state.databases.databases, value];
    }),

  removeDatabase: value =>
    set(state => {
      state.databases.databases = state.databases.databases.filter(database => database.id !== value.id);
    }),
});
