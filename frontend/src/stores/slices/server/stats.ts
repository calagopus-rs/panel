import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface StatsSlice {
  stats: {
    memory: number;
    cpu: number;
    disk: number;
    uptime: number;
    tx: number;
    rx: number;
    state: ServerPowerState;

    setMemory: (value: number) => void;
    setCPU: (value: number) => void;
    setDisk: (value: number) => void;
    setUptime: (value: number) => void;
    setTX: (value: number) => void;
    setRX: (value: number) => void;
    setState: (value: ServerPowerState) => void;
  };
}

export const createStatsSlice: StateCreator<ServerStore, [], [], StatsSlice> = (set): StatsSlice => ({
  stats: {
    memory: 0,
    cpu: 0,
    disk: 0,
    uptime: 0,
    tx: 0,
    rx: 0,
    state: null,

    setMemory: value => set(state => ({ ...state, memory: value })),
    setCPU: value => set(state => ({ ...state, cpu: value })),
    setDisk: value => set(state => ({ ...state, disk: value })),
    setUptime: value => set(state => ({ ...state, uptime: value })),
    setTX: value => set(state => ({ ...state, tx: value })),
    setRX: value => set(state => ({ ...state, rx: value })),
    setState: value => set(state => ({ ...state, state: value })),
  },
});
