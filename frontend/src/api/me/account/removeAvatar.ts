import { axiosInstance } from '@/api/axios';

export default async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete('/api/client/account/avatar')
      .then(() => resolve())
      .catch(reject);
  });
};
