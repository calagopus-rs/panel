import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { serverSettingsRenameSchema } from '@/lib/schemas/server/settings.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (uuid: string, data: z.infer<typeof serverSettingsRenameSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/settings/rename`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
