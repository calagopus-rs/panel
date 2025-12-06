import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { adminLocationSchema } from '@/lib/schemas/admin/locations';

export default async (locationUuid: string, data: z.infer<typeof adminLocationSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/locations/${locationUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
