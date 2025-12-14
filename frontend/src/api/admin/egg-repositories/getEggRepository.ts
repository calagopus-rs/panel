import { axiosInstance } from '@/api/axios.ts';

export default async (eggRepositoryUuid: string): Promise<AdminEggRepository> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/egg-repositories/${eggRepositoryUuid}`)
      .then(({ data }) => resolve(data.eggRepository))
      .catch(reject);
  });
};
