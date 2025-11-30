import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { adminSettingsEmailSchema } from '@/lib/schemas';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (data: z.infer<typeof adminSettingsEmailSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        mail_mode: transformKeysToSnakeCase(data),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
