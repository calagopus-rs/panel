import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<Mount>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/mounts', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.mounts))
      .catch(reject);
  });
};
