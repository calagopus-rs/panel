import { axiosInstance } from '@/api/axios';

interface Data {
  envVariable: string;
  value: string;
}

export default async (uuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/startup/variables`, {
        env_variable: data.envVariable,
        value: data.value,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
