import { axiosInstance } from '@/api/axios';

export default async (token: string, password: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/reset', { token, new_password: password })
      .then(() => resolve())
      .catch(reject);
  });
};
