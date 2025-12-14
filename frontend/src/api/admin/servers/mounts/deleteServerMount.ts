import { axiosInstance } from '@/api/axios.ts';

export default async (serverUuid: string, mountUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/servers/${serverUuid}/mounts/${mountUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
