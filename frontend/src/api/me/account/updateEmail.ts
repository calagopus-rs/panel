import { axiosInstance } from '@/api/axios';

interface Data {
  email: string;
  password: string;
}

export default async (data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/client/account/email', data)
      .then(() => resolve())
      .catch(reject);
  });
};
