import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';

import { adminSettingsApplicationSchema } from '@/lib/schemas/admin/settings.ts';

export default async (data: z.infer<typeof adminSettingsApplicationSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        app: {
          name: data.name,
          url: data.url,
          telemetry_enabled: data.telemetryEnabled,
          registration_enabled: data.registrationEnabled,
        },
      })
      .then(() => resolve())
      .catch(reject);
  });
};
