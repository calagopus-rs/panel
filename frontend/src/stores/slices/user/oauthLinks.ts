import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { UserStore } from '@/stores/user.ts';

export interface OAuthLinksSlice {
  oauthLinks: ResponseMeta<UserOAuthLink>;

  setOAuthLinks: (links: ResponseMeta<UserOAuthLink>) => void;
  removeOAuthLink: (link: UserOAuthLink) => void;
}

export const createOAuthLinksSlice: StateCreator<UserStore, [], [], OAuthLinksSlice> = (set): OAuthLinksSlice => ({
  oauthLinks: getEmptyPaginationSet<UserOAuthLink>(),

  setOAuthLinks: (value) => set((state) => ({ ...state, oauthLinks: value })),
  removeOAuthLink: (link) =>
    set((state) => ({
      oauthLinks: {
        ...state.oauthLinks,
        data: state.oauthLinks.data.filter((k) => k.uuid !== link.uuid),
        total: state.oauthLinks.total - 1,
      },
    })),
});
