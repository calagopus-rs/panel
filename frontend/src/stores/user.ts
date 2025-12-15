import { create } from 'zustand';
import { ApiKeySlice, createApiKeysSlice } from '@/stores/slices/user/apiKeys.ts';
import { createOAuthLinksSlice, OAuthLinksSlice } from '@/stores/slices/user/oauthLinks.ts';
import { createSecurityKeysSlice, SecurityKeySlice } from '@/stores/slices/user/securityKeys.ts';
import { createServersSlice, ServerSlice } from '@/stores/slices/user/servers.ts';
import { createSessionsSlice, SessionSlice } from '@/stores/slices/user/sessions.ts';
import { createSshKeysSlice, SshKeySlice } from '@/stores/slices/user/sshKeys.ts';

export interface UserStore
  extends ServerSlice,
    ApiKeySlice,
    SessionSlice,
    SshKeySlice,
    SecurityKeySlice,
    OAuthLinksSlice {}

export const useUserStore = create<UserStore>()((...a) => ({
  ...createServersSlice(...a),
  ...createApiKeysSlice(...a),
  ...createSessionsSlice(...a),
  ...createSshKeysSlice(...a),
  ...createSecurityKeysSlice(...a),
  ...createOAuthLinksSlice(...a),
}));
