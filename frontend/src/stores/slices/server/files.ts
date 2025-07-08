import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface FilesSlice {
  browsingDirectory: string;
  selectedFiles: string[];

  setBrowsingDirectory: (dir: string) => void;
  setSelectedFiles: (files: string[]) => void;
  addSelectedFile: (file: string) => void;
  removeSelectedFile: (file: string) => void;
}

export const createFilesSlice: StateCreator<ServerStore, [], [], FilesSlice> = (set): FilesSlice => ({
  browsingDirectory: '/',
  selectedFiles: [],

  setBrowsingDirectory: value => set(state => ({ ...state, browsingDirectory: value })),
  setSelectedFiles: value => set(state => ({ ...state, selectedFiles: value })),
  addSelectedFile: value => set(state => ({ ...state, selectedFiles: [...state.selectedFiles, value] })),
  removeSelectedFile: value =>
    set(state => ({ ...state, selectedFiles: state.selectedFiles.filter(file => file !== value) })),
});
