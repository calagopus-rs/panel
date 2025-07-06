import { axiosInstance } from '@/api/axios';

export default async (code: string, password: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/two-factor`, {
        data: { code, password },
      })
      .then(() => resolve())
      .catch(reject);
  });
};
