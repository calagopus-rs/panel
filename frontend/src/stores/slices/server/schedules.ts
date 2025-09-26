import { getEmptyPaginationSet } from '@/api/axios';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface SchedulesSlice {
  schedules: ResponseMeta<ServerSchedule>;

  setSchedules: (schedules: ResponseMeta<ServerSchedule>) => void;
  addSchedule: (schedule: ServerSchedule) => void;
  removeSchedule: (schedule: ServerSchedule) => void;

  scheduleStatus: Map<string, ScheduleStatus>;
  scheduleStepErrors: Map<string, string>;

  setScheduleStatus: (schedule: string, status: ScheduleStatus) => void;
  getScheduleStatus: (schedule: string) => ScheduleStatus;
  setScheduleStepError: (scheduleStep: string, error: string) => void;
  getScheduleStepError: (scheduleStep: ScheduleStep) => string | null;
  removeScheduleStepError: (scheduleStep: string) => void;
}

export const createSchedulesSlice: StateCreator<ServerStore, [], [], SchedulesSlice> = (set, get): SchedulesSlice => ({
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

  scheduleStatus: new Map(),
  scheduleStepErrors: new Map(),

  setScheduleStatus: (schedule, status) =>
    set((state) => {
      state.scheduleStatus.set(schedule, status);

      return { ...state };
    }),
  getScheduleStatus: (schedule) => get().scheduleStatus.get(schedule) ?? { running: false, step: null },
  setScheduleStepError: (step, error) =>
    set((state) => {
      state.scheduleStepErrors.set(step, error);

      return { ...state };
    }),
  getScheduleStepError: (step) => get().scheduleStepErrors.get(step.uuid) ?? step.error,
  removeScheduleStepError: (step) =>
    set((state) => {
      state.scheduleStepErrors.delete(step);

      return { ...state };
    }),
});
