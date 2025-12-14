import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';
import { adminDatabaseHostSchema } from '@/lib/schemas/admin/databaseHosts.ts';

export default async (data: z.infer<typeof adminDatabaseHostSchema>): Promise<AdminDatabaseHost> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/database-hosts', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.databaseHost))
      .catch(reject);
  });
};
