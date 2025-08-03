import { axiosInstance } from '@/api/axios';

export default async (uuid: string, path: string, destination: string | null): Promise<DirectoryEntry> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/copy`, { file: path, destination })
      .then(({ data }) => resolve(data.entry))
      .catch(reject);
  });
};
