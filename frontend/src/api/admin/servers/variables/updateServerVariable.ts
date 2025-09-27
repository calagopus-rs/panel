import { axiosInstance } from '@/api/axios';

interface Data {
  envVariable: string;
  value: string;
}

export default async (serverUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/servers/${serverUuid}/variables`, {
        env_variable: data.envVariable,
        value: data.value,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
