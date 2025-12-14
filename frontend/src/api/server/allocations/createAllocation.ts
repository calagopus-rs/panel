import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string): Promise<ServerAllocation> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/allocations`)
      .then(({ data }) => resolve(data.allocation))
      .catch(reject);
  });
};
