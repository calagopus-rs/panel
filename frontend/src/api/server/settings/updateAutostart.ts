import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { serverSettingsAutostartSchema } from '@/lib/schemas/server/settings.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (uuid: string, data: z.infer<typeof serverSettingsAutostartSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/settings/auto-start`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
