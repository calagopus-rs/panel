import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import isEqual from 'react-fast-compare';
import { createKeysSlice, KeySlice } from './slices/user/apiKeys';

interface UserStore {
  user: User | null | undefined;
  auth: {
    token: string;
  };

  // Actions
  setUser: (user: User) => void;
  setAuthToken: (token: string) => void;

  // Slices
  keys: KeySlice;
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
    keys: createKeysSlice(set),

    clear: () => {
      set({
        user: undefined,

        keys: createKeysSlice(set),
      });
    },
  })),
);
