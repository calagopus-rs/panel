import { create } from 'zustand';
import { ServerSlice, createServersSlice } from '@/stores/slices/user/servers.ts';
import { ApiKeySlice, createApiKeysSlice } from '@/stores/slices/user/apiKeys.ts';
import { createSessionsSlice, SessionSlice } from '@/stores/slices/user/sessions.ts';
import { createSshKeysSlice, SshKeySlice } from '@/stores/slices/user/sshKeys.ts';
import { createSecurityKeysSlice, SecurityKeySlice } from '@/stores/slices/user/securityKeys.ts';
import { createOAuthLinksSlice, OAuthLinksSlice } from '@/stores/slices/user/oauthLinks.ts';

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
