import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<AdminDatabaseHost>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/database-hosts', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.databaseHosts))
      .catch(reject);
  });
};
