import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { serverBackupCreateSchema } from '@/lib/schemas/server/backups.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (uuid: string, data: z.infer<typeof serverBackupCreateSchema>): Promise<ServerBackup> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/backups`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.backup))
      .catch(reject);
  });
};
