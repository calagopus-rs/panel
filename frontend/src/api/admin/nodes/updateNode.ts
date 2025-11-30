import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminNodeSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (nodeUuid: string, data: z.infer<typeof adminNodeSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nodes/${nodeUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
