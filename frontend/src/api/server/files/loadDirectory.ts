import { axiosInstance } from '@/api/axios';
import { transformKeysToCamelCase } from '@/api/transformers';

export default async (uuid: string, directory?: string): Promise<DirectoryEntry[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/files/list`, {
        params: { directory: directory ?? '/' },
      })
      .then(({ data }) => resolve((data.entries.data || []).map((datum: any) => transformKeysToCamelCase(datum))))
      .catch(reject);
  });
};
