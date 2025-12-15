import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/settings/install/cancel`)
      .then(({ status }) => resolve(status === 200))
      .catch(reject);
  });
};
