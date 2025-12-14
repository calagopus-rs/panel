import { axiosInstance } from '@/api/axios.ts';

export default async (userUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/users/${userUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
