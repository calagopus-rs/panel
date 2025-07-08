import { axiosInstance } from '@/api/axios';

export default async (uuid: string, directory?: string): Promise<DirectoryEntry[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/files/list`, {
        params: { directory: directory ?? '/' },
      })
      .then(({ data }) => resolve((data.entries || []).map((datum: any) => datum)))
      .catch(reject);
  });
};
