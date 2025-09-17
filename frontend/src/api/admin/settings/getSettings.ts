import { axiosInstance } from '@/api/axios';

export default async (): Promise<AdminSettings> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/settings')
      .then(({ data }) => resolve(data.settings))
      .catch(reject);
  });
};
