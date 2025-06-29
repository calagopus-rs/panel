import { axiosInstance } from '@/api/axios';

export async function createDirectory(uuid: string, root: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/create-folder`, { root, name })
      .then(() => resolve())
      .catch(reject);
  });
}
