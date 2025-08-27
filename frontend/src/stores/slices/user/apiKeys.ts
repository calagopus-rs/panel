import { getEmptyPaginationSet } from '@/api/axios';
import { UserStore } from '@/stores/user';
import { StateCreator } from 'zustand';

export interface ApiKeySlice {
  apiKeys: ResponseMeta<UserApiKey>;

  setApiKeys: (keys: ResponseMeta<UserApiKey>) => void;
  addApiKey: (key: UserApiKey) => void;
  removeApiKey: (key: UserApiKey) => void;
  updateApiKey: (uuid: string, key: Partial<UserApiKey>) => void;
}

export const createApiKeysSlice: StateCreator<UserStore, [], [], ApiKeySlice> = (set): ApiKeySlice => ({
  apiKeys: getEmptyPaginationSet<UserApiKey>(),

  setApiKeys: (value) => set((state) => ({ ...state, apiKeys: value })),
  addApiKey: (key) =>
    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        data: [...state.apiKeys.data, key],
        total: state.apiKeys.total + 1,
      },
    })),
  removeApiKey: (key) =>
    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        data: state.apiKeys.data.filter((k) => k.uuid !== key.uuid),
        total: state.apiKeys.total - 1,
      },
    })),
  updateApiKey: (uuid, key) =>
    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        data: state.apiKeys.data.map((k) => (k.uuid === uuid ? { ...k, ...key } : k)),
      },
    })),
});
