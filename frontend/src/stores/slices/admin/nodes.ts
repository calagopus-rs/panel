import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface NodesSlice {
  nodes: ResponseMeta<Node>;

  setNodes: (nodes: ResponseMeta<Node>) => void;
  addNode: (node: Node) => void;
  removeNode: (node: Node) => void;
  updateNode: (node: Node) => void;
}

export const createNodesSlice: StateCreator<AdminStore, [], [], NodesSlice> = (set): NodesSlice => ({
  nodes: getEmptyPaginationSet<Node>(),

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
        data: state.nodes.data.filter((n) => n.id !== node.id),
        total: state.nodes.total - 1,
      },
    })),
  updateNode: (node) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        data: state.nodes.data.map((n) => (n.id === node.id ? node : n)),
      },
    })),
});
