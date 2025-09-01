import { axiosInstance } from '@/api/axios';

export default async (locationUuid: string, hostUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/locations/${locationUuid}/database-hosts/${hostUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
