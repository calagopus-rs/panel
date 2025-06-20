import { ServerPowerState } from '@/api/types';

export interface StatusSlice {
  value: ServerPowerState;
  setServerStatus: (status: ServerPowerState) => void;
}

export const createStatusSlice = (set): StatusSlice => ({
  value: null,

  setServerStatus: (status: ServerPowerState) =>
    set(state => {
      state.status.value = status;
    }),
});
