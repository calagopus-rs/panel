import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface MountsSlice {
  mounts: ResponseMeta<Mount>;
  setMounts: (mounts: ResponseMeta<Mount>) => void;
  addMount: (mount: Mount) => void;
  removeMount: (mount: Mount) => void;
}

export const createMountsSlice: StateCreator<AdminStore, [], [], MountsSlice> = (set): MountsSlice => ({
  mounts: getEmptyPaginationSet<Mount>(),
  setMounts: (value) => set((state) => ({ ...state, mounts: value })),
  addMount: (mount) =>
    set((state) => ({
      mounts: {
        ...state.mounts,
        data: [...state.mounts.data, mount],
        total: state.mounts.total + 1,
      },
    })),
  removeMount: (mount) =>
    set((state) => ({
      mounts: {
        ...state.mounts,
        data: state.mounts.data.filter((dh) => dh.uuid !== mount.uuid),
        total: state.mounts.total - 1,
      },
    })),
});
