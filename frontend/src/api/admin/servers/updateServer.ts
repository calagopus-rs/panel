import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminServerSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (serverUuid: string, data: z.infer<typeof adminServerSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/servers/${serverUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
