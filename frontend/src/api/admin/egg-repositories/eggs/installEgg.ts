import { axiosInstance } from '@/api/axios';

export default async (
  eggRepositoryUuid: string,
  eggRepositoryEggUuid: string,
  nestUuid: string,
): Promise<AdminNestEgg> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/egg-repositories/${eggRepositoryUuid}/eggs/${eggRepositoryEggUuid}/install`, {
        nest_uuid: nestUuid,
      })
      .then(({ data }) => resolve(data.egg))
      .catch(reject);
  });
};
