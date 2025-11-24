import { axiosInstance } from '@/api/axios';

interface Data {
  code: string;
  password: string;
}

export default async (data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete('/api/client/account/two-factor', {
        data,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
