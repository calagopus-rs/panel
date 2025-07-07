import { UserStore } from '@/stores/user';
import { StateCreator } from 'zustand';

export interface UserSlice {
  user: User | null;

  setUser: (user: User) => void;
}

export const createUserSlice: StateCreator<UserStore, [], [], UserSlice> = (set): UserSlice => ({
  user: null,

  setUser: value => set(state => ({ ...state, user: value })),
});
