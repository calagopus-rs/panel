import { getEmptyPaginationSet } from '@/api/axios.ts';
import { UserStore } from '@/stores/user.ts';
import { StateCreator } from 'zustand';

export interface SecurityKeySlice {
  securityKeys: ResponseMeta<UserSecurityKey>;

  setSecurityKeys: (keys: ResponseMeta<UserSecurityKey>) => void;
  addSecurityKey: (key: UserSecurityKey) => void;
  removeSecurityKey: (key: UserSecurityKey) => void;
  updateSecurityKey: (uuid: string, data: Partial<UserSecurityKey>) => void;
}

export const createSecurityKeysSlice: StateCreator<UserStore, [], [], SecurityKeySlice> = (set): SecurityKeySlice => ({
  securityKeys: getEmptyPaginationSet<UserSecurityKey>(),

  setSecurityKeys: (value) => set((state) => ({ ...state, securityKeys: value })),
  addSecurityKey: (key) =>
    set((state) => ({
      securityKeys: {
        ...state.securityKeys,
        data: [...state.securityKeys.data, key],
        total: state.securityKeys.total + 1,
      },
    })),
  removeSecurityKey: (key) =>
    set((state) => ({
      securityKeys: {
        ...state.securityKeys,
        data: state.securityKeys.data.filter((k) => k.uuid !== key.uuid),
        total: state.securityKeys.total - 1,
      },
    })),
  updateSecurityKey: (uuid, data) =>
    set((state) => ({
      securityKeys: {
        ...state.securityKeys,
        data: state.securityKeys.data.map((k) => (k.uuid === uuid ? { ...k, ...data } : k)),
      },
    })),
});
