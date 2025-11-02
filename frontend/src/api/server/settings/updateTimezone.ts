import { axiosInstance } from '@/api/axios';

export default async (uuid: string, timezone: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/settings/timezone`, {
        timezone,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
