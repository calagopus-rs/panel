import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface StartupSlice {
  variables: ServerVariable[];

  setVariables: (variables: ServerVariable[]) => void;
  updateVariable: (envVariable: string, updatedProps: Partial<ServerVariable>) => void;
}

export const createStartupSlice: StateCreator<ServerStore, [], [], StartupSlice> = (set): StartupSlice => ({
  variables: [],

  setVariables: (variables) => set((state) => ({ ...state, variables })),
  updateVariable: (envVariable, updatedProps) =>
    set((state) => ({
      variables: state.variables.map((v) => (v.envVariable === envVariable ? { ...v, ...updatedProps } : v)),
    })),
});
