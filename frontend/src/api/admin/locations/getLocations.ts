import { axiosInstance } from '@/api/axios';

export default async (page: number, search?: string): Promise<ResponseMeta<Location>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/locations', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.locations))
      .catch(reject);
  });
};
