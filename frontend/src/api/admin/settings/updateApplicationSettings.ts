import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  icon: string;
  url: string;
  telemetryEnabled: boolean;
}

export default async (data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/settings`, {
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
