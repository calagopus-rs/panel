import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface EggsSlice {
  eggs: ResponseMeta<AdminNestEgg>;
  eggMounts: ResponseMeta<NodeMount>;
  eggVariables: NestEggVariable[];

  setEggs: (eggs: ResponseMeta<AdminNestEgg>) => void;
  addEgg: (egg: AdminNestEgg) => void;
  removeEgg: (egg: AdminNestEgg) => void;

  setEggMounts: (mounts: ResponseMeta<NodeMount>) => void;
  addEggMount: (mount: NodeMount) => void;
  removeEggMount: (mount: NodeMount) => void;

  setEggVariables: (variables: NestEggVariable[]) => void;
  addEggVariable: (variables: NestEggVariable) => void;
  removeEggVariable: (variables: NestEggVariable) => void;
}

export const createEggsSlice: StateCreator<AdminStore, [], [], EggsSlice> = (set): EggsSlice => ({
  eggs: getEmptyPaginationSet<AdminNestEgg>(),
  eggMounts: getEmptyPaginationSet<NodeMount>(),
  eggVariables: [],

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

  setEggMounts: (value) => set((state) => ({ ...state, eggMounts: value })),
  addEggMount: (mount) =>
    set((state) => ({
      eggMounts: {
        ...state.eggMounts,
        data: [...state.eggMounts.data, mount],
        total: state.eggMounts.total + 1,
      },
    })),
  removeEggMount: (mount) =>
    set((state) => ({
      eggMounts: {
        ...state.eggMounts,
        data: state.eggMounts.data.filter((m) => m.mount.uuid !== mount.mount.uuid),
        total: state.eggMounts.total - 1,
      },
    })),

  setEggVariables: (value) => set((state) => ({ ...state, eggVariables: value })),
  addEggVariable: (variable) =>
    set((state) => ({
      eggVariables: [variable, ...state.eggVariables],
    })),
  removeEggVariable: (variable) =>
    set((state) => ({
      eggVariables: state.eggVariables.filter((v) => v.uuid !== variable.uuid),
    })),
});
