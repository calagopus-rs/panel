import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { adminRoleSchema } from '@/lib/schemas/admin/roles';

export default async (data: z.infer<typeof adminRoleSchema>): Promise<Role> => {
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
