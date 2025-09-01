import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface ServerSlice {
  server: Server;

  imagePulls: Map<string, ImagePullProgress>;

  setServer: (server: Server) => void;
  updateServer: (updatedProps: Partial<Server>) => void;

  setImagePull: (id: string, pull: ImagePullProgress) => void;
  removeImagePull: (id: string) => void;
}

export const createServerSlice: StateCreator<ServerStore, [], [], ServerSlice> = (set): ServerSlice => ({
  server: null,

  imagePulls: new Map<string, ImagePullProgress>(),

  setServer: (value) => set((state) => ({ ...state, server: value })),
  updateServer: (updatedProps) =>
    set((state) => ({
      server: { ...state.server, ...updatedProps },
    })),

  setImagePull: (uuid, progress) =>
    set((state) => {
      state.imagePulls.set(uuid, progress);
      return { ...state };
    }),
  removeImagePull: (uuid) =>
    set((state) => {
      state.imagePulls.delete(uuid);
      return { ...state };
    }),
});
