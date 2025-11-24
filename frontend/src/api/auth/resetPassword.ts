import { axiosInstance } from '@/api/axios';

interface Data {
  password: string;
}

export default async (token: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/reset', { token, new_password: data.password })
      .then(() => resolve())
      .catch(reject);
  });
};
