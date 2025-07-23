import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface BackupsSlice {
  backups: ResponseMeta<ServerBackupWithProgress>;

  setBackups: (backups: ResponseMeta<ServerBackupWithProgress>) => void;
  addBackup: (backups: ServerBackupWithProgress) => void;
  removeBackup: (backups: ServerBackupWithProgress) => void;
  updateBackup: (uuid: string, updatedProps: Partial<ServerBackupWithProgress>) => void;
  setBackupProgress: (uuid: string, progress: number, total: number) => void;
}

export const createBackupsSlice: StateCreator<ServerStore, [], [], BackupsSlice> = (set): BackupsSlice => ({
  backups: getEmptyPaginationSet<ServerBackupWithProgress>(),

  setBackups: (value) => set((state) => ({ ...state, backups: value })),
  addBackup: (backup) =>
    set((state) => ({
      backups: {
        ...state.backups,
        data: [...state.backups.data, backup],
        total: state.backups.total + 1,
      },
    })),
  removeBackup: (backup) =>
    set((state) => ({
      backups: {
        ...state.backups,
        data: state.backups.data.filter((b) => b.uuid !== backup.uuid),
        total: state.backups.total - 1,
      },
    })),
  updateBackup: (uuid, updatedProps) =>
    set((state) => ({
      backups: {
        ...state.backups,
        data: state.backups.data.map((b) => (b.uuid === uuid ? { ...b, ...updatedProps } : b)),
      },
    })),
  setBackupProgress: (uuid, progress, total) =>
    set((state) => ({
      backups: {
        ...state.backups,
        data: state.backups.data.map((b) => (b.uuid === uuid ? { ...b, progress: { progress, total } } : b)),
      },
    })),
});
