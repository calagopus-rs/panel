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

  selectedFileNames: Set<string>;
  setSelectedFiles: (files: DirectoryEntry[]) => void;
  addSelectedFile: (file: DirectoryEntry) => void;
  removeSelectedFile: (file: DirectoryEntry) => void;
  isFileSelected: (file: DirectoryEntry) => boolean;
  getSelectedFiles: () => DirectoryEntry[];

  movingFileNames: Set<string>;
  movingFilesDirectory: string | null;
  setMovingFiles: (files: DirectoryEntry[]) => void;
  clearMovingFiles: () => void;
  getMovingFiles: () => DirectoryEntry[];

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

  selectedFileNames: new Set<string>(),
  setSelectedFiles: (files) => set((state) => ({ ...state, selectedFileNames: new Set(files.map((f) => f.name)) })),
  addSelectedFile: (file) =>
    set((state) => {
      const newSet = new Set(state.selectedFileNames);
      newSet.add(file.name);
      return { ...state, selectedFileNames: newSet };
    }),
  removeSelectedFile: (file) =>
    set((state) => {
      const newSet = new Set(state.selectedFileNames);
      newSet.delete(file.name);
      return { ...state, selectedFileNames: newSet };
    }),
  isFileSelected: (file) => get().selectedFileNames.has(file.name),
  getSelectedFiles: () => {
    const state = get();
    return state.browsingEntries.data.filter((entry) => state.selectedFileNames.has(entry.name));
  },

  movingFileNames: new Set<string>(),
  movingFilesDirectory: null,
  setMovingFiles: (files) =>
    set((state) => ({
      ...state,
      movingFileNames: new Set(files.map((f) => f.name)),
      movingFilesDirectory: state.browsingDirectory,
    })),
  clearMovingFiles: () =>
    set((state) => ({ ...state, movingFileNames: new Set<string>(), movingFilesDirectory: null })),
  getMovingFiles: () => {
    const state = get();
    return state.browsingEntries.data.filter((entry) => state.movingFileNames.has(entry.name));
  },

  fileOperations: new Map<string, FileOperation>(),
  setFileOperation: (uuid, operation) =>
    set((state) => {
      const newMap = new Map(state.fileOperations);
      newMap.set(uuid, operation);
      return { ...state, fileOperations: newMap };
    }),
  removeFileOperation: (uuid) =>
    set((state) => {
      const newMap = new Map(state.fileOperations);
      newMap.delete(uuid);
      return { ...state, fileOperations: newMap };
    }),

  refreshFiles: (page: number) => {
    const state = get();

    loadDirectory(state.server.uuid, state.browsingDirectory, page).then((data) => {
      set((state) => ({ ...state, browsingEntries: data }));
    });
  },
});
