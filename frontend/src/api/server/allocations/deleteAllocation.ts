import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, allocationUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/allocations/${allocationUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
