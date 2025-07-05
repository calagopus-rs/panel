import { axiosInstance } from '@/api/axios';

export default async (email: string, password: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/account/email`, {
        email,
        password,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
