import { axiosInstance } from '@/api/axios';

export default async (hostUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/database-hosts/${hostUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
