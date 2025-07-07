import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface FilesSlice {
  files: {
    directory: string;
    selectedFiles: string[];

    setDirectory: (dir: string) => void;
    setSelectedFiles: (files: string[]) => void;
    addSelectedFile: (file: string) => void;
    removeSelectedFile: (file: string) => void;
  };
}

export const createFilesSlice: StateCreator<ServerStore, [], [], FilesSlice> = (set): FilesSlice => ({
  files: {
    directory: '/',
    selectedFiles: [],

    setDirectory: value => set(state => ({ ...state, directory: value })),
    setSelectedFiles: value => set(state => ({ ...state, selectedFiles: value })),
    addSelectedFile: value => set(state => ({ ...state, selectedFiles: [...state.files.selectedFiles, value] })),
    removeSelectedFile: value =>
      set(state => ({ ...state, selectedFiles: state.files.selectedFiles.filter(file => file !== value) })),
  },
});
