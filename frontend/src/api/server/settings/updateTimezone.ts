import { axiosInstance } from '@/api/axios';

interface Data {
  timezone: string;
}

export default async (uuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/settings/timezone`, {
        timezone: data.timezone,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
