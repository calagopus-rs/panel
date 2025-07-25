import { axiosInstance } from '@/api/axios';

export default async (data: AdminSettings['app']): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        app: {
          name: data.name,
          icon: data.icon,
          url: data.url,
          telemetry_enabled: data.telemetryEnabled,
        },
      })
      .then(() => resolve())
      .catch(reject);
  });
};
