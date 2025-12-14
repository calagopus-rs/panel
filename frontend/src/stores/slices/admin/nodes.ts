import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';
import { StateCreator } from 'zustand';

export interface NodesSlice {
  nodes: ResponseMeta<Node>;
  nodeMounts: ResponseMeta<NodeMount>;
  nodeAllocations: ResponseMeta<NodeAllocation>;
  selectedNodeAllocations: NodeAllocation[];

  setNodes: (nodes: ResponseMeta<Node>) => void;
  addNode: (node: Node) => void;
  removeNode: (node: Node) => void;

  setNodeMounts: (mounts: ResponseMeta<NodeMount>) => void;
  addNodeMount: (mount: NodeMount) => void;
  removeNodeMount: (mount: NodeMount) => void;

  setNodeAllocations: (allocations: ResponseMeta<NodeAllocation>) => void;
  removeNodeAllocations: (allocations: NodeAllocation[]) => void;

  setSelectedNodeAllocations: (allocations: NodeAllocation[]) => void;
  addSelectedNodeAllocation: (allocation: NodeAllocation) => void;
  isNodeAllocationSelected: (allocation: NodeAllocation) => boolean;
  removeSelectedNodeAllocation: (allocation: NodeAllocation) => void;
}

export const createNodesSlice: StateCreator<AdminStore, [], [], NodesSlice> = (set, get): NodesSlice => ({
  nodes: getEmptyPaginationSet<Node>(),
  nodeMounts: getEmptyPaginationSet<NodeMount>(),
  nodeAllocations: getEmptyPaginationSet<NodeAllocation>(),
  selectedNodeAllocations: [],

  setNodes: (value) => set((state) => ({ ...state, nodes: value })),
  addNode: (node) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        data: [...state.nodes.data, node],
        total: state.nodes.total + 1,
      },
    })),
  removeNode: (node) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        data: state.nodes.data.filter((l) => l.uuid !== node.uuid),
        total: state.nodes.total - 1,
      },
    })),

  setNodeMounts: (value) => set((state) => ({ ...state, nodeMounts: value })),
  addNodeMount: (mount) =>
    set((state) => ({
      nodeMounts: {
        ...state.nodeMounts,
        data: [...state.nodeMounts.data, mount],
        total: state.nodeMounts.total + 1,
      },
    })),
  removeNodeMount: (mount) =>
    set((state) => ({
      nodeMounts: {
        ...state.nodeMounts,
        data: state.nodeMounts.data.filter((l) => l.mount.uuid !== mount.mount.uuid),
        total: state.nodeMounts.total - 1,
      },
    })),

  setNodeAllocations: (value) => set((state) => ({ ...state, nodeAllocations: value })),
  removeNodeAllocations: (allocations) =>
    set((state) => ({
      nodeAllocations: {
        ...state.nodeAllocations,
        data: state.nodeAllocations.data.filter((a) => !allocations.some((al) => al.uuid === a.uuid)),
        total: state.nodeAllocations.total - allocations.length,
      },
    })),

  setSelectedNodeAllocations: (value) => set((state) => ({ ...state, selectedNodeAllocations: value })),
  addSelectedNodeAllocation: (value) =>
    set((state) => {
      if (state.selectedNodeAllocations.every((a) => a.uuid !== value.uuid)) {
        return { ...state, selectedNodeAllocations: [...state.selectedNodeAllocations, value] };
      }

      return { ...state };
    }),
  isNodeAllocationSelected: (value) => get().selectedNodeAllocations.some((a) => a.uuid === value.uuid),
  removeSelectedNodeAllocation: (value) =>
    set((state) => {
      return { ...state, selectedNodeAllocations: state.selectedNodeAllocations.filter((a) => a.uuid !== value.uuid) };
    }),
});
