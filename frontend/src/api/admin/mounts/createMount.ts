import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { adminMountSchema } from '@/lib/schemas/admin/mounts';

export default async (data: z.infer<typeof adminMountSchema>): Promise<Mount> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/mounts', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.mount))
      .catch(reject);
  });
};
