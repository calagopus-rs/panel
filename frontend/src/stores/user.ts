import { create } from 'zustand';
import { ApiKeySlice, createApiKeysSlice } from './slices/user/apiKeys';
import { createSshKeysSlice, SshKeySlice } from './slices/user/sshKeys';
import { createUserSlice, UserSlice } from './slices/user/user';

export interface UserStore extends ApiKeySlice, UserSlice, SshKeySlice {}

export const useUserStore = create<UserStore>()((...a) => ({
  ...createApiKeysSlice(...a),
  ...createUserSlice(...a),
  ...createSshKeysSlice(...a),
}));
