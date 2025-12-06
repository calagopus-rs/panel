import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { adminServerCreateSchema } from '@/lib/schemas/admin/servers';

export default async (data: z.infer<typeof adminServerCreateSchema>): Promise<AdminServer> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/servers', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.server))
      .catch(reject);
  });
};
