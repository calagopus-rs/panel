export interface DatabasesSlice {
  databases: any[];

  setDatabases: (databases: any[]) => void;
  addDatabase: (database: any) => void;
  removeDatabase: (database: any) => void;
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
