import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface SchedulesSlice {
  schedules: ResponseMeta<ServerSchedule>;

  setSchedules: (schedules: ResponseMeta<ServerSchedule>) => void;
  addSchedule: (schedules: ServerSchedule) => void;
  removeSchedule: (schedules: ServerSchedule) => void;
}

export const createSchedulesSlice: StateCreator<ServerStore, [], [], SchedulesSlice> = (set): SchedulesSlice => ({
  schedules: getEmptyPaginationSet<ServerSchedule>(),

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
        data: state.schedules.data.filter((s) => s.uuid !== schedule.uuid),
        total: state.schedules.total - 1,
      },
    })),
});
