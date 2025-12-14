import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { authForgotPasswordSchema } from '@/lib/schemas/auth.ts';

export default async (data: z.infer<typeof authForgotPasswordSchema>, captcha: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/forgot', { ...data, captcha })
      .then(() => resolve())
      .catch(reject);
  });
};
