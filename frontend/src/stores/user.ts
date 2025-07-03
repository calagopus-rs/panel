import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import isEqual from 'react-fast-compare';

interface UserStore {
  user: User | null;
  auth: {
    token: string;
  };

  // Actions
  setUser: (user: User) => void;
  setAuthToken: (token: string) => void;
}

export const useUserStore = create<UserStore>()(
  immer((set, get) => ({
    user: null,
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

    clear: () => {
      set({
        user: null,
      });
    },
  })),
);
