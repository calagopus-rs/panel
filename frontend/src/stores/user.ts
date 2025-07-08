import { create } from 'zustand';
import { ApiKeySlice, createApiKeysSlice } from './slices/user/apiKeys';
import { createSessionsSlice, SessionSlice } from './slices/user/sessions';
import { SshKeySlice, createSshKeysSlice } from './slices/user/sshKeys';

export interface UserStore extends ApiKeySlice, SessionSlice, SshKeySlice {}

export const useUserStore = create<UserStore>()((...a) => ({
  ...createApiKeysSlice(...a),
  ...createSessionsSlice(...a),
  ...createSshKeysSlice(...a),
}));
