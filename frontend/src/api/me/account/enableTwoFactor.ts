import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { dashboardTwoFactorEnableSchema } from '@/lib/schemas/dashboard.ts';

interface Response {
  recoveryCodes: string[];
}

export default async (data: z.infer<typeof dashboardTwoFactorEnableSchema>): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/two-factor', data)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
