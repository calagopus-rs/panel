import { StateCreator } from 'zustand';
import { AdminStore } from '@/stores/admin.tsx';

export interface SettingsSlice extends AdminSettings {
  setSettings: (settings: AdminSettings) => void;
}

export const createSettingsSlice: StateCreator<AdminStore, [], [], SettingsSlice> = (set): SettingsSlice => ({
  oobeStep: null,
  storageDriver: {
    type: 'filesystem',
    path: '',
  },
  mailMode: {
    type: 'none',
  },
  captchaProvider: {
    type: 'none',
  },
  app: {
    name: '',
    language: '',
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
