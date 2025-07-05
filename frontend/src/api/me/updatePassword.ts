import { axiosInstance } from '@/api/axios';

export default async (password: string, newPassword: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/account/password`, {
        password,
        new_password: newPassword,
      })
      .then(({ data }) => resolve(data.user))
      .catch(reject);
  });
};
