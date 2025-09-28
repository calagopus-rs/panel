import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface SettingsSlice extends AdminSettings {
  setSettings: (settings: AdminSettings) => void;
}

export const createSettingsSlice: StateCreator<AdminStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  storageDriver: null,
  mailMode: null,
  captchaProvider: null,
  app: {
    name: '',
    url: '',
    telemetryEnabled: true,
    registrationEnabled: true,
  },
  server: {
    maxFileManagerViewSize: 10 * 1024 * 1024 * 1024,
    maxSchedulesStepCount: 100,
    allowOverwritingCustomDockerImage: true,
    allowEditingStartupCommand: false,
  },
  webauthn: {
    rpId: '',
    rpOrigin: '',
  },

  setSettings: (value) =>
    set((state) => {
      state.storageDriver = value.storageDriver;
      state.mailMode = value.mailMode;
      state.captchaProvider = value.captchaProvider;
      state.app = value.app;
      state.server = value.server;
      state.webauthn = value.webauthn;
      return state;
    }),
});
