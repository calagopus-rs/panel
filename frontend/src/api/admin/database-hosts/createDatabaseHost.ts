import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (data: UpdateAdminDatabaseHost): Promise<AdminDatabaseHost> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/database-hosts', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.databaseHost))
      .catch(reject);
  });
};
