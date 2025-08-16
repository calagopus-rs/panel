import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface NestsSlice {
  nests: ResponseMeta<Nest>;

  setNests: (nests: ResponseMeta<Nest>) => void;
  addNest: (nest: Nest) => void;
  removeNest: (nest: Nest) => void;
}

export const createNestsSlice: StateCreator<AdminStore, [], [], NestsSlice> = (set): NestsSlice => ({
  nests: getEmptyPaginationSet<Nest>(),

  setNests: (value) => set((state) => ({ ...state, nests: value })),
  addNest: (nest) =>
    set((state) => ({
      nests: {
        ...state.nests,
        data: [...state.nests.data, nest],
        total: state.nests.total + 1,
      },
    })),
  removeNest: (nest) =>
    set((state) => ({
      nests: {
        ...state.nests,
        data: state.nests.data.filter((n) => n.uuid !== nest.uuid),
        total: state.nests.total - 1,
      },
    })),
});
