import { axiosInstance } from '@/api/axios';

interface Data {
  command: string;
}

export default async (uuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/startup/command`, {
        command: data.command,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
