export interface FilesSlice {
  directory: string;
  selectedFiles: string[];

  setDirectory: (dir: string) => void;
  setSelectedFiles: (files: string[]) => void;
  addSelectedFile: (file: string) => void;
  removeSelectedFile: (file: string) => void;
}

export const createFilesSlice = (set): FilesSlice => ({
  directory: '',
  selectedFiles: [],

  setDirectory: value =>
    set(state => {
      state.files.directory = value;
    }),

  setSelectedFiles: value =>
    set(state => {
      state.files.selectedFiles = value;
    }),

  addSelectedFile: value =>
    set(state => {
      state.files.selectedFiles = [...state.files.selectedFiles, value];
    }),

  removeSelectedFile: value =>
    set(state => {
      state.files.selectedFiles = state.files.selectedFiles.filter(file => file !== value);
    }),
});
