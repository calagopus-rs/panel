import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface SubusersSlice {
  subusers: ResponseMeta<ServerSubuser>;

  setSubusers: (subusers: ResponseMeta<ServerSubuser>) => void;
  addSubuser: (subusers: ServerSubuser) => void;
  removeSubuser: (subusers: ServerSubuser) => void;
}

export const createSubusersSlice: StateCreator<ServerStore, [], [], SubusersSlice> = (set): SubusersSlice => ({
  subusers: getEmptyPaginationSet<ServerSubuser>(),
  setSubusers: (value) => set((state) => ({ ...state, subusers: value })),
  addSubuser: (subuser) =>
    set((state) => ({
      subusers: {
        ...state.subusers,
        data: [...state.subusers.data, subuser],
        total: state.subusers.total + 1,
      },
    })),
  removeSubuser: (subuser) =>
    set((state) => ({
      subusers: {
        ...state.subusers,
        data: state.subusers.data.filter((s) => s.user.uuid !== subuser.user.uuid),
        total: state.subusers.total - 1,
      },
    })),
});
