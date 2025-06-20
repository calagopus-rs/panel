import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type ServerListDesign = 'row' | 'grid';

interface SettingsStore {
  serverListDesign: ServerListDesign;
  setServerListDesign: (design: ServerListDesign) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  immer((set, get) => ({
    serverListDesign: 'grid',

    setServerListDesign: design => {
      if (design !== get().serverListDesign) {
        set({ serverListDesign: design });
      }
    },
  })),
);
