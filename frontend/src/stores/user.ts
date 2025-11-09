import { create } from 'zustand';
import { ApiKeySlice, createApiKeysSlice } from '@/stores/slices/user/apiKeys';
import { createSessionsSlice, SessionSlice } from '@/stores/slices/user/sessions';
import { createSshKeysSlice, SshKeySlice } from '@/stores/slices/user/sshKeys';
import { createSecurityKeysSlice, SecurityKeySlice } from '@/stores/slices/user/securityKeys';
import { createOAuthLinksSlice, OAuthLinksSlice } from '@/stores/slices/user/oauthLinks';

export interface UserStore extends ApiKeySlice, SessionSlice, SshKeySlice, SecurityKeySlice, OAuthLinksSlice {}

export const useUserStore = create<UserStore>()((...a) => ({
  ...createApiKeysSlice(...a),
  ...createSessionsSlice(...a),
  ...createSshKeysSlice(...a),
  ...createSecurityKeysSlice(...a),
  ...createOAuthLinksSlice(...a),
}));
