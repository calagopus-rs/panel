import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { adminLocationSchema } from '@/lib/schemas/admin/locations.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (data: z.infer<typeof adminLocationSchema>): Promise<Location> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/locations', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.location))
      .catch(reject);
  });
};
