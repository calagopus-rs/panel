import { axiosInstance } from '@/api/axios';

export default async (email: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/forgot', { email, captcha: null })
      .then(() => resolve())
      .catch(reject);
  });
};
