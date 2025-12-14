import { ServerStore } from '@/stores/server.ts';
import { StateCreator } from 'zustand';

export interface StatsSlice {
  stats: ResourceUsage | null;

  setStats: (stats: ResourceUsage) => void;
}

export const createStatsSlice: StateCreator<ServerStore, [], [], StatsSlice> = (set): StatsSlice => ({
  stats: null,

  setStats: (value) => set((state) => ({ ...state, stats: value })),
});
