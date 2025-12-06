import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { adminNestSchema } from '@/lib/schemas/admin/nests';

export default async (data: z.infer<typeof adminNestSchema>): Promise<AdminNest> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/nests', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
