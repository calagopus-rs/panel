import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface EggsSlice {
  eggs: ResponseMeta<AdminNestEgg>;

  setEggs: (eggs: ResponseMeta<AdminNestEgg>) => void;
  addEgg: (egg: AdminNestEgg) => void;
  removeEgg: (egg: AdminNestEgg) => void;
}

export const createEggsSlice: StateCreator<AdminStore, [], [], EggsSlice> = (set): EggsSlice => ({
  eggs: getEmptyPaginationSet<AdminNestEgg>(),
  setEggs: (value) => set((state) => ({ ...state, eggs: value })),
  addEgg: (egg) =>
    set((state) => ({
      eggs: {
        ...state.eggs,
        data: [...state.eggs.data, egg],
        total: state.eggs.total + 1,
      },
    })),
  removeEgg: (egg) =>
    set((state) => ({
      eggs: {
        ...state.eggs,
        data: state.eggs.data.filter((e) => e.uuid !== egg.uuid),
        total: state.eggs.total - 1,
      },
    })),
});
