import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<AdminActivity>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/activity', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.activities))
      .catch(reject);
  });
};
