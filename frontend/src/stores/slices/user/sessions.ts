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

  removeSession: value =>
    set(state => {
      state.sessions.data = state.sessions.data.filter(sess => sess.id !== value.id);
      state.sessions.total -= 1;
      return state;
    }),
});
