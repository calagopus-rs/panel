import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

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
