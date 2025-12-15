import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<AdminServer>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/servers', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.servers))
      .catch(reject);
  });
};
