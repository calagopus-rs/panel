import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminLocationSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: z.infer<typeof adminLocationSchema>): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/locations', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
