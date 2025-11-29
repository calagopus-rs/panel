import { axiosInstance } from '@/api/axios';

export default async (eggRepositoryUuid: string): Promise<AdminEggRepository> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/egg-repositories/${eggRepositoryUuid}`)
      .then(({ data }) => resolve(data.eggRepository))
      .catch(reject);
  });
};
