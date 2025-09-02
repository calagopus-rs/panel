import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nodes/${nodeUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
