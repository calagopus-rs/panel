import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import isEqual from 'react-fast-compare';
import { ApiKeySlice, createApiKeysSlice } from './slices/user/apiKeys';
import { createSshKeysSlice, SshKeySlice } from './slices/user/sshKeys';

interface UserStore {
  user: User | null | undefined;
  auth: {
    token: string;
  };

  // Actions
  setUser: (user: User) => void;
  setAuthToken: (token: string) => void;

  // Slices
  apiKeys: ApiKeySlice;
  sshKeys: SshKeySlice;
}

export const useUserStore = create<UserStore>()(
  immer((set, get) => ({
    user: undefined,
    auth: {
      token: '',
    },

    setUser: user => {
      if (!isEqual(get().user, user)) {
        set({ user: user });
      }
    },

    setAuthToken: token => {
      if (token !== get().auth.token) {
        set({ auth: { token: token } });
      }
    },

    apiKeys: createApiKeysSlice(set),
    sshKeys: createSshKeysSlice(set),

    clear: () => {
      set({
        user: undefined,
        auth: {
          token: '',
        },

        apiKeys: createApiKeysSlice(set),
        sshKeys: createSshKeysSlice(set),
      });
    },
  })),
);
