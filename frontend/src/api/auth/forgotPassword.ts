import { axiosInstance } from '@/api/axios';

export default async (email: string, captcha: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/forgot', { email, captcha })
      .then(() => resolve())
      .catch(reject);
  });
};
