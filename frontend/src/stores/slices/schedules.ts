export interface SchedulesSlice {
  schedules: Schedule[];

  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (schedule: Schedule) => void;
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
