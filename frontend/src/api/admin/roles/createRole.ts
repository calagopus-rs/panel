import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: UpdateRole): Promise<Role> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/roles', {
        ...transformKeysToSnakeCase(data),
        admin_permissions: Array.from(data.adminPermissions),
        server_permissions: Array.from(data.serverPermissions),
      })
      .then(({ data }) => resolve(data.role))
      .catch(reject);
  });
};
