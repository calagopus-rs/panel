import { axiosInstance } from '@/api/axios';

export default async (): Promise<PublicSettings> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/settings')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
