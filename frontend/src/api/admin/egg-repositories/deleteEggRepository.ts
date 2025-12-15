import { axiosInstance } from '@/api/axios.ts';

export default async (eggRepositoryUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/egg-repositories/${eggRepositoryUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
