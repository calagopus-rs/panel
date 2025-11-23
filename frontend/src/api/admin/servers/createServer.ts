import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: Partial<UpdateAdminServer>): Promise<AdminServer> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/servers', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.server))
      .catch(reject);
  });
};
