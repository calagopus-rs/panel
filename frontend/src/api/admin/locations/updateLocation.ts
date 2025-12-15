import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { adminLocationSchema } from '@/lib/schemas/admin/locations.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (locationUuid: string, data: z.infer<typeof adminLocationSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/locations/${locationUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
