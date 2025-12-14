import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';
import { StateCreator } from 'zustand';

export interface BackupConfigurationsSlice {
  backupConfigurations: ResponseMeta<BackupConfiguration>;

  setBackupConfigurations: (backupConfigurations: ResponseMeta<BackupConfiguration>) => void;
  addBackupConfiguration: (backupConfigurations: BackupConfiguration) => void;
  removeBackupConfiguration: (backupConfigurations: BackupConfiguration) => void;
}

export const createBackupConfigurationsSlice: StateCreator<AdminStore, [], [], BackupConfigurationsSlice> = (
  set,
): BackupConfigurationsSlice => ({
  backupConfigurations: getEmptyPaginationSet<BackupConfiguration>(),

  setBackupConfigurations: (value) => set((state) => ({ ...state, backupConfigurations: value })),
  addBackupConfiguration: (backupConfiguration) =>
    set((state) => ({
      backupConfigurations: {
        ...state.backupConfigurations,
        data: [...state.backupConfigurations.data, backupConfiguration],
        total: state.backupConfigurations.total + 1,
      },
    })),
  removeBackupConfiguration: (backupConfiguration) =>
    set((state) => ({
      backupConfigurations: {
        ...state.backupConfigurations,
        data: state.backupConfigurations.data.filter((bc) => bc.uuid !== backupConfiguration.uuid),
        total: state.backupConfigurations.total - 1,
      },
    })),
});
