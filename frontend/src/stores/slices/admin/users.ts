import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';

export interface UsersSlice {
  users: ResponseMeta<User>;
  userOAuthLinks: ResponseMeta<UserOAuthLink>;

  setUsers: (users: ResponseMeta<User>) => void;
  addUser: (user: User) => void;
  removeUser: (user: User) => void;

  setUserOAuthLinks: (links: ResponseMeta<UserOAuthLink>) => void;
  addUserOAuthLink: (link: UserOAuthLink) => void;
  removeUserOAuthLink: (link: UserOAuthLink) => void;
}

export const createUsersSlice: StateCreator<AdminStore, [], [], UsersSlice> = (set): UsersSlice => ({
  users: getEmptyPaginationSet<User>(),
  userOAuthLinks: getEmptyPaginationSet<UserOAuthLink>(),

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

  setUserOAuthLinks: (value) => set((state) => ({ ...state, userOAuthLinks: value })),
  addUserOAuthLink: (link) =>
    set((state) => ({
      userOAuthLinks: {
        ...state.userOAuthLinks,
        data: [...state.userOAuthLinks.data, link],
        total: state.userOAuthLinks.total + 1,
      },
    })),
  removeUserOAuthLink: (link) =>
    set((state) => ({
      userOAuthLinks: {
        ...state.userOAuthLinks,
        data: state.userOAuthLinks.data.filter((u) => u.uuid !== link.uuid),
        total: state.userOAuthLinks.total - 1,
      },
    })),
});
