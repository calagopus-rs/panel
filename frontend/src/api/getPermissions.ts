import { axiosInstance } from '@/api/axios';

export default async (): Promise<Permissions> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/permissions')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
