import { GlobalStore } from '@/stores/global';
import { StateCreator } from 'zustand';

export interface PermissionsSlice {
  availablePermissions: Permissions;

  setAvailablePermissions: (permissions: Permissions) => void;
}

export const createPermissionsSlice: StateCreator<GlobalStore, [], [], PermissionsSlice> = (set): PermissionsSlice => ({
  availablePermissions: null,

  setAvailablePermissions: (value) => set((state) => ({ ...state, availablePermissions: value })),
});
