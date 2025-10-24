import { create } from 'zustand';
import { createApiKeysSlice, ApiKeySlice } from '@/stores/slices/user/apiKeys';
import { createSessionsSlice, SessionSlice } from '@/stores/slices/user/sessions';
import { createSshKeysSlice, SshKeySlice } from '@/stores/slices/user/sshKeys';
import { createSecurityKeysSlice, SecurityKeySlice } from '@/stores/slices/user/securityKeys';

export interface UserStore extends ApiKeySlice, SessionSlice, SshKeySlice, SecurityKeySlice {}

export const useUserStore = create<UserStore>()((...a) => ({
  ...createApiKeysSlice(...a),
  ...createSessionsSlice(...a),
  ...createSshKeysSlice(...a),
  ...createSecurityKeysSlice(...a),
}));
