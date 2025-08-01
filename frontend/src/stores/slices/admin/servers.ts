import { StateCreator } from 'zustand';

export interface ServersSlice {
  servers: ResponseMeta<AdminServer>;
  setServers: (servers: ResponseMeta<AdminServer>) => void;

  nodes: ResponseMeta<Node>;
  setNodes: (nodes: ResponseMeta<Node>) => void;

  nests: ResponseMeta<Nest>;
  setNests: (nests: ResponseMeta<Nest>) => void;

  eggs: ResponseMeta<AdminNestEgg>;
  setEggs: (eggs: ResponseMeta<AdminNestEgg>) => void;

  users: ResponseMeta<User>;
  setUsers: (users: ResponseMeta<User>) => void;

  allocations: ResponseMeta<NodeAllocation>;
  setAllocations: (allocations: ResponseMeta<NodeAllocation>) => void;
}

export const createServersSlice: StateCreator<ServersSlice> = (set) => ({
  servers: {
    total: 0,
    perPage: 25,
    page: 1,
    data: [],
  },
  setServers: (servers) => set({ servers }),

  nodes: {
    total: 0,
    perPage: 25,
    page: 1,
    data: [],
  },
  setNodes: (nodes) => set({ nodes }),

  nests: {
    total: 0,
    perPage: 25,
    page: 1,
    data: [],
  },
  setNests: (nests) => set({ nests }),

  eggs: {
    total: 0,
    perPage: 25,
    page: 1,
    data: [],
  },
  setEggs: (eggs) => set({ eggs }),

  users: {
    total: 0,
    perPage: 25,
    page: 1,
    data: [],
  },
  setUsers: (users) => set({ users }),

  allocations: {
    total: 0,
    perPage: 25,
    page: 1,
    data: [],
  },
  setAllocations: (allocations) => set({ allocations }),
});
