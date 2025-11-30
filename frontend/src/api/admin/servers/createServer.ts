import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminServerSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: z.infer<typeof adminServerSchema>): Promise<AdminServer> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/servers', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.server))
      .catch(reject);
  });
};
