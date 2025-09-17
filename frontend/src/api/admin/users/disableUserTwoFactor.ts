import { axiosInstance } from '@/api/axios';

export default async (userUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/users/${userUuid}/two-factor`)
      .then(() => resolve())
      .catch(reject);
  });
};
