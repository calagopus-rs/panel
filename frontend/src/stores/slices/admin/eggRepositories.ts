import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';

export interface EggRepositoriesSlice {
  eggRepositories: ResponseMeta<AdminEggRepository>;

  setEggRepositories: (eggRepositories: ResponseMeta<AdminEggRepository>) => void;
  addEggRepository: (eggRepository: AdminEggRepository) => void;
  removeEggRepository: (eggRepository: AdminEggRepository) => void;
}

export const createEggRepositoriesSlice: StateCreator<AdminStore, [], [], EggRepositoriesSlice> = (
  set,
): EggRepositoriesSlice => ({
  eggRepositories: getEmptyPaginationSet<AdminEggRepository>(),
  setEggRepositories: (value) => set((state) => ({ ...state, eggRepositories: value })),
  addEggRepository: (eggRepository) =>
    set((state) => ({
      eggRepositories: {
        ...state.eggRepositories,
        data: [...state.eggRepositories.data, eggRepository],
        total: state.eggRepositories.total + 1,
      },
    })),
  removeEggRepository: (eggRepository) =>
    set((state) => ({
      eggRepositories: {
        ...state.eggRepositories,
        data: state.eggRepositories.data.filter((n) => n.uuid !== eggRepository.uuid),
        total: state.eggRepositories.total - 1,
      },
    })),
});
