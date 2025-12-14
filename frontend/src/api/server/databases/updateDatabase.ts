import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { serverDatabaseEditSchema } from '@/lib/schemas/server/databases.ts';

export default async (
  uuid: string,
  databaseUuid: string,
  data: z.infer<typeof serverDatabaseEditSchema>,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/databases/${databaseUuid}`, data)
      .then(() => resolve())
      .catch(reject);
  });
};
