import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { serverDatabaseCreateSchema } from '@/lib/schemas/server/databases.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (uuid: string, data: z.infer<typeof serverDatabaseCreateSchema>): Promise<ServerDatabase> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/databases`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.database))
      .catch(reject);
  });
};
