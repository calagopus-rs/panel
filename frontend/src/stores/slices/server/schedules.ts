import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { ServerStore } from '@/stores/server.ts';

export interface SchedulesSlice {
  schedules: ResponseMeta<ServerSchedule>;
  runningScheduleSteps: Map<string, string | null>;

  setSchedules: (schedules: ResponseMeta<ServerSchedule>) => void;
  addSchedule: (schedule: ServerSchedule) => void;
  removeSchedule: (schedule: ServerSchedule) => void;
  setRunningScheduleStep: (schedule: string, step: string | null) => void;

  schedule: ServerSchedule | null;
  scheduleSteps: ScheduleStep[];

  setSchedule: (scheduleStep: ServerSchedule) => void;
  setScheduleSteps: (scheduleSteps: ScheduleStep[]) => void;
}

export const createSchedulesSlice: StateCreator<ServerStore, [], [], SchedulesSlice> = (set, get): SchedulesSlice => ({
  schedules: getEmptyPaginationSet<ServerSchedule>(),
  runningScheduleSteps: new Map(),

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
  setRunningScheduleStep: (schedule, step) =>
    set((state) => {
      state.runningScheduleSteps.set(schedule, step);

      return { ...state };
    }),

  schedule: null,
  scheduleSteps: [],

  setSchedule: (schedule) => set((state) => ({ ...state, schedule })),
  setScheduleSteps: (steps) => set((state) => ({ ...state, scheduleSteps: steps })),
});
