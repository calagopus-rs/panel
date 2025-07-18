import { axiosInstance } from '@/api/axios';

export default async (location: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/locations/${location}`)
      .then(() => resolve())
      .catch(reject);
  });
};
