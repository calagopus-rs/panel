import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminNestSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: z.infer<typeof adminNestSchema>): Promise<AdminNest> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/nests', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
