import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

import { adminSettingsStorageSchema } from '@/lib/schemas/admin/settings';

export default async (data: z.infer<typeof adminSettingsStorageSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        storage_driver: transformKeysToSnakeCase(data),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
