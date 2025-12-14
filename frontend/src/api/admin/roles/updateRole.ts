import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';
import { adminRoleSchema } from '@/lib/schemas/admin/roles.ts';

export default async (roleUuid: string, data: z.infer<typeof adminRoleSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/roles/${roleUuid}`, {
        ...transformKeysToSnakeCase(data),
        admin_permissions: Array.from(data.adminPermissions),
        server_permissions: Array.from(data.serverPermissions),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
