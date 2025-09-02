import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface UsersSlice {
  users: ResponseMeta<User>;
  setUsers: (users: ResponseMeta<User>) => void;
  addUser: (user: User) => void;
  removeUser: (user: User) => void;
}

export const createUsersSlice: StateCreator<AdminStore, [], [], UsersSlice> = (set): UsersSlice => ({
  users: getEmptyPaginationSet<User>(),
  setUsers: (value) => set((state) => ({ ...state, users: value })),
  addUser: (user) =>
    set((state) => ({
      users: {
        ...state.users,
        data: [...state.users.data, user],
        total: state.users.total + 1,
      },
    })),
  removeUser: (user) =>
    set((state) => ({
      users: {
        ...state.users,
        data: state.users.data.filter((u) => u.uuid !== user.uuid),
        total: state.users.total - 1,
      },
    })),
});
