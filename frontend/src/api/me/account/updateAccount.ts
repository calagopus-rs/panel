import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { dashboardAccountSchema } from '@/lib/schemas/dashboard.ts';

export default async (data: z.infer<typeof dashboardAccountSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch('/api/client/account', {
        username: data.username,
        name_first: data.nameFirst,
        name_last: data.nameLast,
        language: data.language,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
