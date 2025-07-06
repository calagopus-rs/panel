import { getEmptyPaginationSet } from '@/api/axios';

export interface KeySlice {
  keys: PaginatedResult<UserApiKey>;

  setKeys: (keys: PaginatedResult<UserApiKey>) => void;
  addKey: (key: UserApiKey) => void;
  removeKey: (key: UserApiKey) => void;
}

export const createKeysSlice = (set): KeySlice => ({
  keys: getEmptyPaginationSet<UserApiKey>(),

  setKeys: value =>
    set(state => {
      state.keys.keys = value;
    }),

  addKey: value =>
    set(state => {
      state.keys.keys.data = [...state.keys.keys.data, value];
      state.keys.keys.total += 1;
    }),

  removeKey: value =>
    set(state => {
      state.keys.keys.data = state.keys.keys.data.filter(schedule => schedule.id !== value.id);
      state.keys.keys.total -= 1;
    }),
});
