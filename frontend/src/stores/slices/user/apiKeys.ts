import { getEmptyPaginationSet } from '@/api/axios';

export interface ApiKeySlice {
  keys: ResponseMeta<UserApiKey>;

  setKeys: (keys: ResponseMeta<UserApiKey>) => void;
  addKey: (key: UserApiKey) => void;
  removeKey: (key: UserApiKey) => void;
}

export const createApiKeysSlice = (set): ApiKeySlice => ({
  keys: getEmptyPaginationSet<UserApiKey>(),

  setKeys: value =>
    set(state => {
      state.apiKeys.keys = value;
    }),

  addKey: value =>
    set(state => {
      state.apiKeys.keys.data = [...state.apiKeys.keys.data, value];
      state.apiKeys.keys.total += 1;
    }),

  removeKey: value =>
    set(state => {
      state.apiKeys.keys.data = state.apiKeys.keys.data.filter(schedule => schedule.id !== value.id);
      state.apiKeys.keys.total -= 1;
    }),
});
