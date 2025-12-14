import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';
import { StateCreator } from 'zustand';

export interface OAuthProvidersSlice {
  oauthProviders: ResponseMeta<AdminOAuthProvider>;

  setOAuthProviders: (oauthProviders: ResponseMeta<AdminOAuthProvider>) => void;
  addOAuthProvider: (oauthProvider: AdminOAuthProvider) => void;
  removeOAuthProvider: (oauthProvider: AdminOAuthProvider) => void;
}

export const createOAuthProvidersSlice: StateCreator<AdminStore, [], [], OAuthProvidersSlice> = (
  set,
): OAuthProvidersSlice => ({
  oauthProviders: getEmptyPaginationSet<AdminOAuthProvider>(),

  setOAuthProviders: (value) => set((state) => ({ ...state, oauthProviders: value })),
  addOAuthProvider: (oauthProvider) =>
    set((state) => ({
      oauthProviders: {
        ...state.oauthProviders,
        data: [...state.oauthProviders.data, oauthProvider],
        total: state.oauthProviders.total + 1,
      },
    })),
  removeOAuthProvider: (oauthProvider) =>
    set((state) => ({
      oauthProviders: {
        ...state.oauthProviders,
        data: state.oauthProviders.data.filter((dh) => dh.uuid !== oauthProvider.uuid),
        total: state.oauthProviders.total - 1,
      },
    })),
});
