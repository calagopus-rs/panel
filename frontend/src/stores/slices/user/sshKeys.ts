import { getEmptyPaginationSet } from '@/api/axios';

export interface SshKeySlice {
  keys: PaginatedResult<UserSshKey>;

  setKeys: (keys: PaginatedResult<UserSshKey>) => void;
  addKey: (key: UserSshKey) => void;
  removeKey: (key: UserSshKey) => void;
}

export const createSshKeysSlice = (set): SshKeySlice => ({
  keys: getEmptyPaginationSet<UserSshKey>(),

  setKeys: value =>
    set(state => {
      state.sshKeys.keys = value;
    }),

  addKey: value =>
    set(state => {
      state.sshKeys.keys.data = [...state.sshKeys.keys.data, value];
      state.sshKeys.keys.total += 1;
    }),

  removeKey: value =>
    set(state => {
      state.sshKeys.keys.data = state.sshKeys.keys.data.filter(schedule => schedule.id !== value.id);
      state.sshKeys.keys.total -= 1;
    }),
});
