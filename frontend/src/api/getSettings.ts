import { axiosInstance } from '@/api/axios.ts';

export default async (): Promise<PublicSettings> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/settings')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
