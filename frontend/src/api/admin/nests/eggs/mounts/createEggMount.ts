import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, eggUuid: string, mountUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/mounts`, {
        mount_uuid: mountUuid,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
