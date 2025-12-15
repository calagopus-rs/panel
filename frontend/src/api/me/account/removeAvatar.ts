import { axiosInstance } from '@/api/axios.ts';

export default async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete('/api/client/account/avatar')
      .then(() => resolve())
      .catch(reject);
  });
};
