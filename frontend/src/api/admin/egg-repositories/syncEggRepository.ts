import { axiosInstance } from '@/api/axios';

export default async (eggRepositoryUuid: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/egg-repositories/${eggRepositoryUuid}/sync`, {})
      .then(({ data }) => resolve(data.found))
      .catch(reject);
  });
};
