import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { ServerStore } from '@/stores/server.ts';

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
        data: state.allocations.data.filter((a) => a.uuid !== allocation.uuid),
        total: state.allocations.total - 1,
      },
    })),
});
