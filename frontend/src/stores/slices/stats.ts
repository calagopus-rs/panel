export interface StatsSlice {
  memory: number;
  cpu: number;
  disk: number;
  uptime: number;
  tx: number;
  rx: number;

  setMemory: (value: number) => void;
  setCPU: (value: number) => void;
  setDisk: (value: number) => void;
  setUptime: (value: number) => void;
  setTX: (value: number) => void;
  setRX: (value: number) => void;
}

export const createStatsSlice = (set): StatsSlice => ({
  memory: 0,
  cpu: 0,
  disk: 0,
  uptime: 0,
  tx: 0,
  rx: 0,

  setMemory: value =>
    set(state => {
      state.stats.memory = value;
    }),

  setCPU: value =>
    set(state => {
      state.stats.cpu = value;
    }),

  setDisk: value =>
    set(state => {
      state.stats.disk = value;
    }),

  setUptime: value =>
    set(state => {
      state.stats.uptime = value;
    }),

  setTX: value =>
    set(state => {
      state.stats.tx = value;
    }),

  setRX: value =>
    set(state => {
      state.stats.rx = value;
    }),
});
