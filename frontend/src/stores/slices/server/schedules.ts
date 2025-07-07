import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface SchedulesSlice {
  schedules: ResponseMeta<any>;

  setSchedules: (schedules: ResponseMeta<any>) => void;
  addSchedule: (schedules: any) => void;
  removeSchedule: (schedules: any) => void;
}

export const createSchedulesSlice: StateCreator<ServerStore, [], [], SchedulesSlice> = (set): SchedulesSlice => ({
  schedules: getEmptyPaginationSet<any>(),

  setSchedules: value => set(state => ({ ...state, schedules: value })),

  addSchedule: value =>
    set(state => {
      state.schedules.data = [...state.schedules.data, value];
      state.schedules.total += 1;
      return state;
    }),

  removeSchedule: value =>
    set(state => {
      state.schedules.data = state.schedules.data.filter(key => key.id !== value.id);
      state.schedules.total -= 1;
      return state;
    }),
});
