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

  setSchedules: (value) => set((state) => ({ ...state, schedules: value })),
  addSchedule: (schedule) =>
    set((state) => ({
      schedules: {
        ...state.schedules,
        data: [...state.schedules.data, schedule],
        total: state.schedules.total + 1,
      },
    })),
  removeSchedule: (schedule) =>
    set((state) => ({
      schedules: {
        ...state.schedules,
        data: state.schedules.data.filter((s) => s.id !== schedule.id),
        total: state.schedules.total - 1,
      },
    })),
});
