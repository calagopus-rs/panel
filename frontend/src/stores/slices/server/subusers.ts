import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface SubusersSlice {
  subusers: ResponseMeta<ServerSubuser>;

  setSubusers: (subusers: ResponseMeta<ServerSubuser>) => void;
  addSubuser: (subusers: ServerSubuser) => void;
  removeSubuser: (subusers: ServerSubuser) => void;

  availablePermissions: PermissionData;
  setAvailablePermissions: (permissions: PermissionData) => void;
}

export const createSubusersSlice: StateCreator<ServerStore, [], [], SubusersSlice> = (set): SubusersSlice => ({
  subusers: getEmptyPaginationSet<ServerSubuser>(),
  setSubusers: value => set(state => ({ ...state, subusers: value })),
  addSubuser: subuser =>
    set(state => ({
      subusers: {
        ...state.subusers,
        data: [...state.subusers.data, subuser],
        total: state.subusers.total + 1,
      },
    })),
  removeSubuser: subuser =>
    set(state => ({
      subusers: {
        ...state.subusers,
        data: state.subusers.data.filter(s => s.user.id !== subuser.user.id),
        total: state.subusers.total - 1,
      },
    })),

  availablePermissions: null,
  setAvailablePermissions: value => set(state => ({ ...state, availablePermissions: value })),
});
