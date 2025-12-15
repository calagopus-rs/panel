import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { UserStore } from '@/stores/user.ts';

export interface SessionSlice {
  sessions: ResponseMeta<UserSession>;

  setSessions: (sessions: ResponseMeta<UserSession>) => void;
  removeSession: (session: UserSession) => void;
}

export const createSessionsSlice: StateCreator<UserStore, [], [], SessionSlice> = (set): SessionSlice => ({
  sessions: getEmptyPaginationSet<UserSession>(),

  setSessions: (value) => set((state) => ({ ...state, sessions: value })),

  removeSession: (sess) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        data: state.sessions.data.filter((s) => s.uuid !== sess.uuid),
        total: state.sessions.total - 1,
      },
    })),
});
