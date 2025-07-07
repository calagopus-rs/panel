import { getEmptyPaginationSet } from '@/api/axios';
import { UserStore } from '@/stores/user';
import { StateCreator } from 'zustand';

export interface SshKeySlice {
  sshKeys: ResponseMeta<UserSshKey>;

  setSshKeys: (keys: ResponseMeta<UserSshKey>) => void;
  addSshKey: (key: UserSshKey) => void;
  removeSshKey: (key: UserSshKey) => void;
}

export const createSshKeysSlice: StateCreator<UserStore, [], [], SshKeySlice> = (set): SshKeySlice => ({
  sshKeys: getEmptyPaginationSet<UserSshKey>(),

  setSshKeys: value => set(state => ({ ...state, sshKeys: value })),

  addSshKey: value =>
    set(state => {
      state.sshKeys.data = [...state.sshKeys.data, value];
      state.sshKeys.total += 1;
      return state;
    }),

  removeSshKey: value =>
    set(state => {
      state.sshKeys.data = state.sshKeys.data.filter(key => key.id !== value.id);
      state.sshKeys.total -= 1;
      return state;
    }),
});
