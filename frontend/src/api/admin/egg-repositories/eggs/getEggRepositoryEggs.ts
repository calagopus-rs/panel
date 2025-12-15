import { axiosInstance } from '@/api/axios.ts';

export default async (
  eggRepositoryUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<AdminEggRepositoryEgg>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/egg-repositories/${eggRepositoryUuid}/eggs`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.eggRepositoryEggs))
      .catch(reject);
  });
};
