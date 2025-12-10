import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminServerUpdateSchema } from '@/lib/schemas/admin/servers';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface SuspendedServer {
  suspended: boolean;
}

export default async (
  serverUuid: string,
  data: z.infer<typeof adminServerUpdateSchema> | SuspendedServer,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/servers/${serverUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
