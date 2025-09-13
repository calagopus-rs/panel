import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/servers/${serverUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
