import { axiosInstance } from '@/api/axios';

export default async (page: number, search?: string): Promise<ResponseMeta<Nest>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/nests', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.nests))
      .catch(reject);
  });
};
