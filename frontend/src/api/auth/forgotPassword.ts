import { axiosInstance } from '@/api/axios';

interface Data {
  email: string;
}

export default async (data: Data, captcha: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/forgot', { ...data, captcha })
      .then(() => resolve())
      .catch(reject);
  });
};
