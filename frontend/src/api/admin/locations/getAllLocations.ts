import { axiosInstance } from '@/api/axios';

export default async (): Promise<Location[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/locations', {
        params: { page: 1, per_page: 1000 },
      })
      .then(({ data }) => resolve(data.locations.data))
      .catch(reject);
  });
};
