import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface SettingsSlice extends AdminSettings {
  setSettings: (settings: any) => void;
}

export const createSettingsSlice: StateCreator<AdminStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  mailMode: null,
  captchaProvider: null,
  app: {
    name: '',
    icon: '',
    url: '',
    telemetryEnabled: false,
  },
  server: {
    maxFileManagerViewSize: 0,
    allowOverwritingCustomDockerImage: false,
    allowEditingStartupCommand: false,
  },

  setSettings: (value) =>
    set((state) => {
      state.mailMode = value.mailMode;
      state.captchaProvider = value.captchaProvider;
      state.app = value.app;
      state.server = value.server;
      return state;
    }),
});
