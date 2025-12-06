import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

import { adminSettingsCaptchaProviderSchema } from '@/lib/schemas/admin/settings';

export default async (data: z.infer<typeof adminSettingsCaptchaProviderSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        captcha_provider: transformKeysToSnakeCase(data),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
