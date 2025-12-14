import { StateCreator } from 'zustand';
import { ServerStore } from '@/stores/server.ts';

export interface StatsSlice {
  stats: ResourceUsage | null;

  setStats: (stats: ResourceUsage) => void;
}

export const createStatsSlice: StateCreator<ServerStore, [], [], StatsSlice> = (set): StatsSlice => ({
  stats: null,

  setStats: (value) => set((state) => ({ ...state, stats: value })),
});
