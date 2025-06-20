import { ServerStatus } from '@/api/types';

export interface StatusSlice {
  value: ServerStatus;
  setServerStatus: (status: ServerStatus) => void;
}

export const createStatusSlice = (set): StatusSlice => ({
  value: null,

  setServerStatus: (status: ServerStatus) =>
    set(state => {
      state.value = status;
    }),
});
