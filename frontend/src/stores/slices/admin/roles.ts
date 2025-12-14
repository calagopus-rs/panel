import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';
import { StateCreator } from 'zustand';

export interface RolesSlice {
  roles: ResponseMeta<Role>;

  setRoles: (roles: ResponseMeta<Role>) => void;
  addRole: (role: Role) => void;
  removeRole: (role: Role) => void;
}

export const createRolesSlice: StateCreator<AdminStore, [], [], RolesSlice> = (set): RolesSlice => ({
  roles: getEmptyPaginationSet<Role>(),

  setRoles: (value) => set((state) => ({ ...state, roles: value })),
  addRole: (role) =>
    set((state) => ({
      roles: {
        ...state.roles,
        data: [...state.roles.data, role],
        total: state.roles.total + 1,
      },
    })),
  removeRole: (role) =>
    set((state) => ({
      roles: {
        ...state.roles,
        data: state.roles.data.filter((r) => r.uuid !== role.uuid),
        total: state.roles.total - 1,
      },
    })),
});
