import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { dashboardEmailSchema } from '@/lib/schemas/dashboard.ts';

export default async (data: z.infer<typeof dashboardEmailSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/client/account/email', data)
      .then(() => resolve())
      .catch(reject);
  });
};
