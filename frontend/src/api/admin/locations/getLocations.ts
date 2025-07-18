import { axiosInstance } from '@/api/axios';

export default async (page: number): Promise<ResponseMeta<Location>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/locations`, {
        params: { page },
      })
      .then(({ data }) => resolve(data.locations))
      .catch(reject);
  });
};
