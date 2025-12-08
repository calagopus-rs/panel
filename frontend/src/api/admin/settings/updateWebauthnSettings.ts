import { z } from 'zod';
import { axiosInstance } from '@/api/axios';

import { adminSettingsWebauthnSchema } from '@/lib/schemas/admin/settings';

export default async (data: z.infer<typeof adminSettingsWebauthnSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        webauthn: {
          rp_id: data.rpId,
          rp_origin: data.rpOrigin,
        },
      })
      .then(() => resolve())
      .catch(reject);
  });
};
