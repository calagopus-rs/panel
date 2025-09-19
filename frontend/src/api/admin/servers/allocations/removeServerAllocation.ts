import { axiosInstance } from '@/api/axios';

export default async (serverUuid: string, allocationUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/servers/${serverUuid}/allocations/${allocationUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
