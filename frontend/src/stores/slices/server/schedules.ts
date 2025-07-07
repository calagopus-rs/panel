export interface SchedulesSlice {
  schedules: any[];

  setSchedules: (schedules: any[]) => void;
  addSchedule: (schedule: any) => void;
  removeSchedule: (schedule: any) => void;
}

export const createSchedulesSlice = (set): SchedulesSlice => ({
  schedules: [],

  setSchedules: value =>
    set(state => {
      state.schedules.schedules = value;
    }),

  addSchedule: value =>
    set(state => {
      state.schedules.schedules = [...state.schedules.schedules, value];
    }),

  removeSchedule: value =>
    set(state => {
      state.schedules.schedules = state.schedules.schedules.filter(schedule => schedule.id !== value.id);
    }),
});
