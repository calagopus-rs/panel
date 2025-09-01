import { axiosInstance } from '@/api/axios';

export default async (mountUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/mounts/${mountUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
