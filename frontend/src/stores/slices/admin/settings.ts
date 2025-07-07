export interface SettingsSlice extends AdminSettings {
  setSettings: (settings: any) => void;
}

export const createSettingsSlice = (set): SettingsSlice => ({
  mail: {
    type: 'none',
  },
  captcha: {
    type: 'none',
  },
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

  setSettings: value =>
    set(state => {
      state.settings.mail = value.mail;
      state.settings.captcha = value.captcha;
      state.settings.app = value.app;
      state.settings.server = value.server;
    }),
});
