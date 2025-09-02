import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string, mountUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nodes/${nodeUuid}/mounts/${mountUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
