import { axiosInstance } from '@/api/axios.ts';

export default async (nodeUuid: string, backupUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nodes/${nodeUuid}/backups/${backupUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
