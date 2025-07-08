import { axiosInstance } from '@/api/axios';

export default async (uuid: string, root: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/create-directory`, { root, name })
      .then(() => resolve())
      .catch(reject);
  });
};
