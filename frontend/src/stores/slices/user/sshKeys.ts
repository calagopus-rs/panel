import { getEmptyPaginationSet } from '@/api/axios';
import { UserStore } from '@/stores/user';
import { StateCreator } from 'zustand';

export interface SshKeySlice {
  sshKeys: ResponseMeta<UserSshKey>;

  setSshKeys: (keys: ResponseMeta<UserSshKey>) => void;
  addSshKey: (key: UserSshKey) => void;
  removeSshKey: (key: UserSshKey) => void;
  updateSshKey: (uuid: string, data: Partial<UserSshKey>) => void;
}

export const createSshKeysSlice: StateCreator<UserStore, [], [], SshKeySlice> = (set): SshKeySlice => ({
  sshKeys: getEmptyPaginationSet<UserSshKey>(),

  setSshKeys: (value) => set((state) => ({ ...state, sshKeys: value })),
  addSshKey: (key) =>
    set((state) => ({
      sshKeys: {
        ...state.sshKeys,
        data: [...state.sshKeys.data, key],
        total: state.sshKeys.total + 1,
      },
    })),
  removeSshKey: (key) =>
    set((state) => ({
      sshKeys: {
        ...state.sshKeys,
        data: state.sshKeys.data.filter((k) => k.uuid !== key.uuid),
        total: state.sshKeys.total - 1,
      },
    })),
  updateSshKey: (uuid, data) =>
    set((state) => ({
      sshKeys: {
        ...state.sshKeys,
        data: state.sshKeys.data.map((k) => (k.uuid === uuid ? { ...k, ...data } : k)),
      },
    })),
});
