import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import isEqual from 'react-fast-compare';
import { ApiKeySlice, createApiKeysSlice } from './slices/user/apiKeys';

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

    clear: () => {
      set({
        user: undefined,

        apiKeys: createApiKeysSlice(set),
      });
    },
  })),
);
