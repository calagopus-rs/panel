import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { ServerStore } from '@/stores/server.ts';

export interface SchedulesSlice {
  schedules: ResponseMeta<ServerSchedule>;

  setSchedules: (schedules: ResponseMeta<ServerSchedule>) => void;
  addSchedule: (schedule: ServerSchedule) => void;
  removeSchedule: (schedule: ServerSchedule) => void;

  schedule: ServerSchedule | null;
  scheduleSteps: ScheduleStep[];
  scheduleStatus: Map<string, ScheduleStatus>;
  scheduleStepErrors: Map<string, string>;

  setSchedule: (scheduleStep: ServerSchedule) => void;
  setScheduleSteps: (scheduleSteps: ScheduleStep[]) => void;
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

  schedule: null,
  scheduleSteps: [],
  scheduleStatus: new Map(),
  scheduleStepErrors: new Map(),

  setSchedule: (schedule) => set((state) => ({ ...state, schedule })),
  setScheduleSteps: (steps) => set((state) => ({ ...state, scheduleSteps: steps })),
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
