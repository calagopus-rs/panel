import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string, mountUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nodes/${nodeUuid}/mounts`, {
        mount_uuid: mountUuid,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
