import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface SettingsSlice extends AdminSettings {
  setSettings: (settings: AdminSettings) => void;
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
  webauthn: {
    rpId: '',
    rpOrigin: '',
  },

  setSettings: (value) =>
    set((state) => {
      state.mailMode = value.mailMode;
      state.captchaProvider = value.captchaProvider;
      state.app = value.app;
      state.server = value.server;
      state.webauthn = value.webauthn;
      return state;
    }),
});
