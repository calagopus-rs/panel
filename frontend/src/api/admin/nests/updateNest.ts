import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { adminNestSchema } from '@/lib/schemas/admin/nests.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (nestUuid: string, data: z.infer<typeof adminNestSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nests/${nestUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
