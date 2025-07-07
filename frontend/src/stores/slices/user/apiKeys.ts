import { getEmptyPaginationSet } from '@/api/axios';
import { UserStore } from '@/stores/user';
import { StateCreator } from 'zustand';

export interface ApiKeySlice {
  apiKeys: ResponseMeta<UserApiKey>;

  setApiKeys: (keys: ResponseMeta<UserApiKey>) => void;
  addApiKey: (key: UserApiKey) => void;
  removeApiKey: (key: UserApiKey) => void;
}

export const createApiKeysSlice: StateCreator<UserStore, [], [], ApiKeySlice> = (set): ApiKeySlice => ({
  apiKeys: getEmptyPaginationSet<UserApiKey>(),

  setApiKeys: value => set(state => ({ ...state, apiKeys: value })),

  addApiKey: value =>
    set(state => {
      state.apiKeys.data = [...state.apiKeys.data, value];
      state.apiKeys.total += 1;
      return state;
    }),

  removeApiKey: value =>
    set(state => {
      state.apiKeys.data = state.apiKeys.data.filter(key => key.id !== value.id);
      state.apiKeys.total -= 1;
      return state;
    }),
});
