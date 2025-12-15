import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<Role>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/roles', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.roles))
      .catch(reject);
  });
};
