import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { serverBackupEditSchema } from '@/lib/schemas/server/backups.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (
  uuid: string,
  backupUuid: string,
  data: z.infer<typeof serverBackupEditSchema>,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/backups/${backupUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
