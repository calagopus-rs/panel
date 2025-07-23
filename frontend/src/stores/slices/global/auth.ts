import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

export interface AuthSlice {
  twoFactorToken: string | null;

  setTwoFactorToken: (token: string) => void;
}

export const createAuthSlice: StateCreator<GlobalStore, [], [], AuthSlice> = (set): AuthSlice => ({
  twoFactorToken: '',

  setTwoFactorToken: (value) => set((state) => ({ ...state, twoFactorToken: value })),
});
