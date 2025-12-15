import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, command: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/startup/command`, {
        command,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
