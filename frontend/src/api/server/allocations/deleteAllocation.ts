import { axiosInstance } from '@/api/axios';

export default async (uuid: string, allocation: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/allocations/${allocation}`)
      .then(() => resolve())
      .catch(reject);
  });
};
