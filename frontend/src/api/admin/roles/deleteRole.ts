import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/roles/${nestUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
