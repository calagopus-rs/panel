import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<AdminEggRepository>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/egg-repositories', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.eggRepositories))
      .catch(reject);
  });
};
