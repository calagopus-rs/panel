import { StateCreator } from 'zustand';
import { GlobalStore } from '@/stores/global.ts';

export interface PermissionsSlice {
  availablePermissions: ApiPermissions;

  setAvailablePermissions: (permissions: ApiPermissions) => void;
}

export const createPermissionsSlice: StateCreator<GlobalStore, [], [], PermissionsSlice> = (set): PermissionsSlice => ({
  availablePermissions: {
    adminPermissions: {},
    userPermissions: {},
    serverPermissions: {},
  },

  setAvailablePermissions: (value) => set((state) => ({ ...state, availablePermissions: value })),
});
