import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminMountSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (mountUuid: string, data: z.infer<typeof adminMountSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/mounts/${mountUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
