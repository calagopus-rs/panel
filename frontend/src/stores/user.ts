import { create } from 'zustand';
import { ApiKeySlice, createApiKeysSlice } from './slices/user/apiKeys';
import { SshKeySlice, createSshKeysSlice } from './slices/user/sshKeys';
import { UserSlice, createUserSlice } from './slices/user/user';

export interface UserStore extends ApiKeySlice, SshKeySlice, UserSlice {}

export const useUserStore = create<UserStore>()((...a) => ({
  ...createApiKeysSlice(...a),
  ...createSshKeysSlice(...a),
  ...createUserSlice(...a),
}));
