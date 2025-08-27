import { getEmptyPaginationSet } from '@/api/axios';
import loadDirectory from '@/api/server/files/loadDirectory';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface FilesSlice {
  browsingDirectory: string;
  setBrowsingDirectory: (dir: string) => void;

  browsingBackup: ServerBackup | null;
  setBrowsingBackup: (backup: ServerBackup | null) => void;

  browsingEntries: ResponseMeta<DirectoryEntry>;
  setBrowsingEntries: (entries: ResponseMeta<DirectoryEntry>) => void;
  addBrowsingEntry: (entry: DirectoryEntry) => void;
  removeBrowsingEntry: (entry: DirectoryEntry) => void;

  selectedFiles: Set<DirectoryEntry>;
  setSelectedFiles: (files: DirectoryEntry[]) => void;
  addSelectedFile: (file: DirectoryEntry) => void;
  removeSelectedFile: (file: DirectoryEntry) => void;

  movingFiles: Set<DirectoryEntry>;
  movingFilesDirectory: string | null;
  setMovingFiles: (files: DirectoryEntry[]) => void;

  fileOperations: Map<string, FileOperation>;
  setFileOperation: (uuid: string, operation: FileOperation) => void;
  removeFileOperation: (uuid: string) => void;

  refreshFiles: (page: number) => void;
}

export const createFilesSlice: StateCreator<ServerStore, [], [], FilesSlice> = (set, get): FilesSlice => ({
  browsingDirectory: null,
  setBrowsingDirectory: (value) => set((state) => ({ ...state, browsingDirectory: value })),

  browsingBackup: null,
  setBrowsingBackup: (value) => set((state) => ({ ...state, browsingBackup: value })),

  browsingEntries: getEmptyPaginationSet<DirectoryEntry>(),
  setBrowsingEntries: (value) => set((state) => ({ ...state, browsingEntries: value })),
  addBrowsingEntry: (entry) =>
    set((state) => ({
      browsingEntries: {
        ...state.browsingEntries,
        data: [...state.browsingEntries.data, entry],
        total: state.browsingEntries.total + 1,
      },
    })),
  removeBrowsingEntry: (entry) =>
    set((state) => ({
      browsingEntries: {
        ...state.browsingEntries,
        data: state.browsingEntries.data.filter((e) => e.name !== entry.name),
        total: state.browsingEntries.total - 1,
      },
    })),

  selectedFiles: new Set<DirectoryEntry>(),
  setSelectedFiles: (value) => set((state) => ({ ...state, selectedFiles: new Set(value) })),
  addSelectedFile: (value) =>
    set((state) => {
      state.selectedFiles.add(value);

      return { ...state };
    }),
  removeSelectedFile: (value) =>
    set((state) => {
      state.selectedFiles.delete(value);

      return { ...state };
    }),

  movingFiles: new Set<DirectoryEntry>(),
  movingFilesDirectory: null,
  setMovingFiles: (files) =>
    set((state) => ({ ...state, movingFiles: new Set(files), movingFilesDirectory: state.browsingDirectory })),

  fileOperations: new Map<string, FileOperation>(),
  setFileOperation: (uuid, operation) =>
    set((state) => {
      state.fileOperations.set(uuid, operation);
      return { ...state };
    }),
  removeFileOperation: (uuid) =>
    set((state) => {
      state.fileOperations.delete(uuid);
      return { ...state };
    }),

  refreshFiles: (page: number) => {
    const state = get();

    loadDirectory(state.server.uuid, state.browsingDirectory, page).then((data) => {
      set((state) => ({ ...state, browsingEntries: data }));
    });
  },
});
