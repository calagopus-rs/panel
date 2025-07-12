import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface FilesSlice {
  browsingDirectory: string;
  setBrowsingDirectory: (dir: string) => void;

  browsingEntries: ResponseMeta<DirectoryEntry>;
  setBrowsingEntries: (entries: ResponseMeta<DirectoryEntry>) => void;
  addBrowsingEntry: (entry: DirectoryEntry) => void;
  removeBrowsingEntry: (entry: DirectoryEntry) => void;

  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  addSelectedFile: (file: string) => void;
  removeSelectedFile: (file: string) => void;
}

export const createFilesSlice: StateCreator<ServerStore, [], [], FilesSlice> = (set): FilesSlice => ({
  browsingDirectory: null,
  setBrowsingDirectory: value => set(state => ({ ...state, browsingDirectory: value })),

  browsingEntries: getEmptyPaginationSet<DirectoryEntry>(),
  setBrowsingEntries: value => set(state => ({ ...state, browsingEntries: value })),
  addBrowsingEntry: entry =>
    set(state => ({
      browsingEntries: {
        ...state.browsingEntries,
        data: [...state.browsingEntries.data, entry],
        total: state.browsingEntries.total + 1,
      },
    })),
  removeBrowsingEntry: entry =>
    set(state => ({
      browsingEntries: {
        ...state.browsingEntries,
        data: state.browsingEntries.data.filter(e => e.name !== entry.name),
        total: state.browsingEntries.total - 1,
      },
    })),

  selectedFiles: [],
  setSelectedFiles: value => set(state => ({ ...state, selectedFiles: value })),
  addSelectedFile: value => set(state => ({ ...state, selectedFiles: [...state.selectedFiles, value] })),
  removeSelectedFile: value =>
    set(state => ({ ...state, selectedFiles: state.selectedFiles.filter(file => file !== value) })),
});
