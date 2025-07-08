import { create } from 'zustand';
import { ApiKeySlice, createApiKeysSlice } from './slices/user/apiKeys';
import { SshKeySlice, createSshKeysSlice } from './slices/user/sshKeys';

export interface UserStore extends ApiKeySlice, SshKeySlice {}

export const useUserStore = create<UserStore>()((...a) => ({
  ...createApiKeysSlice(...a),
  ...createSshKeysSlice(...a),
}));
