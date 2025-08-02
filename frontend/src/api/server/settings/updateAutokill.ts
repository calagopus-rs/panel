import { axiosInstance } from '@/api/axios';

interface Data {
  enabled: boolean;
  seconds: number;
}

export default async (uuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/settings/auto-kill`, {
        enabled: data.enabled,
        seconds: data.seconds,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
