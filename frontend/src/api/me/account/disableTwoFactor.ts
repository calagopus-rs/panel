import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { dashboardTwoFactorDisableSchema } from '@/lib/schemas/dashboard.ts';

export default async (data: z.infer<typeof dashboardTwoFactorDisableSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete('/api/client/account/two-factor', {
        data,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
