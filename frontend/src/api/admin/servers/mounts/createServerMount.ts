import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

interface Data {
  mountUuid: string;
}

export default async (serverUuid: string, data: Data): Promise<AdminServerMount> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/servers/${serverUuid}/mounts`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
