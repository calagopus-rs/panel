import { axiosInstance } from '@/api/axios.ts';

export default async (): Promise<ApiPermissions> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/permissions')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
