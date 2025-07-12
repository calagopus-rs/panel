import { getEmptyPaginationSet } from '@/api/axios';
import { UserStore } from '@/stores/user';
import { StateCreator } from 'zustand';

export interface SessionSlice {
  sessions: ResponseMeta<UserSession>;

  setSessions: (sessions: ResponseMeta<UserSession>) => void;
  removeSession: (session: UserSession) => void;
}

export const createSessionsSlice: StateCreator<UserStore, [], [], SessionSlice> = (set): SessionSlice => ({
  sessions: getEmptyPaginationSet<UserSession>(),

  setSessions: value => set(state => ({ ...state, sessions: value })),

  removeSession: sess =>
    set(state => ({
      sessions: {
        ...state.sessions,
        data: state.sessions.data.filter(s => s.id !== sess.id),
        total: state.sessions.total - 1,
      },
    })),
});
