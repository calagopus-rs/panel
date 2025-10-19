import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/servers/${serverUuid}/clear-state`, {})
      .then(() => resolve())
      .catch(reject);
  });
};
