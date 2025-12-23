import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { adminDatabaseHostCreateSchema } from '@/lib/schemas/admin/databaseHosts.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (data: z.infer<typeof adminDatabaseHostCreateSchema>): Promise<AdminDatabaseHost> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/database-hosts', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.databaseHost))
      .catch(reject);
  });
};
