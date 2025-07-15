import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface BackupsSlice {
  backups: ResponseMeta<ServerBackup>;

  setBackups: (backups: ResponseMeta<ServerBackup>) => void;
  addBackup: (backups: ServerBackup) => void;
  removeBackup: (backups: ServerBackup) => void;
}

export const createBackupsSlice: StateCreator<ServerStore, [], [], BackupsSlice> = (set): BackupsSlice => ({
  backups: getEmptyPaginationSet<any>(),

  setBackups: value => set(state => ({ ...state, backups: value })),
  addBackup: backup =>
    set(state => ({
      backups: {
        ...state.backups,
        data: [...state.backups.data, backup],
        total: state.backups.total + 1,
      },
    })),
  removeBackup: backup =>
    set(state => ({
      backups: {
        ...state.backups,
        data: state.backups.data.filter(b => b.uuid !== backup.uuid),
        total: state.backups.total - 1,
      },
    })),
});
