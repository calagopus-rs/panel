import { axiosInstance } from '@/api/axios';

export default async (uuid: string, root: string, files: string[]): Promise<{ deleted: number }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/delete`, { root, files })
      .then(({ data }) => resolve(data.deleted))
      .catch(reject);
  });
};
