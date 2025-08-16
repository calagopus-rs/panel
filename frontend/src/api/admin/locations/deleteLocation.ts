import { axiosInstance } from '@/api/axios';

export default async (locationUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/locations/${locationUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
