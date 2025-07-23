import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface AllocationsSlice {
  allocations: ResponseMeta<ServerAllocation>;

  setAllocations: (allocation: ResponseMeta<ServerAllocation>) => void;
  addAllocation: (allocation: ServerAllocation) => void;
  removeAllocation: (allocation: ServerAllocation) => void;
}

export const createAllocationsSlice: StateCreator<ServerStore, [], [], AllocationsSlice> = (set): AllocationsSlice => ({
  allocations: getEmptyPaginationSet<ServerAllocation>(),

  setAllocations: (value) => set((state) => ({ ...state, allocations: value })),
  addAllocation: (allocation) =>
    set((state) => ({
      allocations: {
        ...state.allocations,
        data: [...state.allocations.data, allocation],
        total: state.allocations.total + 1,
      },
    })),
  removeAllocation: (allocation) =>
    set((state) => ({
      allocations: {
        ...state.allocations,
        data: state.allocations.data.filter((a) => a.id !== allocation.id),
        total: state.allocations.total - 1,
      },
    })),
});
