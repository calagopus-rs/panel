import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { adminDatabaseHostSchema } from '@/lib/schemas/admin/databaseHosts';

export default async (hostUuid: string, data: z.infer<typeof adminDatabaseHostSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/database-hosts/${hostUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
