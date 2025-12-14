import { axiosInstance } from '@/api/axios.ts';

export default async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/logout')
      .then(() => resolve())
      .catch(reject);
  });
};
